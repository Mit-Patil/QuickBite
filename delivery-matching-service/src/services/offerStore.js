const redis = require('../config/redis');
const { offerTimeoutSeconds } = require('../config/env');

const EXPIRY_KEY = 'delivery:offer:expiry';
const TRIED_TTL_SECONDS = 24 * 60 * 60;

const offerKey = (orderId) => `delivery:offer:${orderId}`;      
const triedKey = (orderId) => `delivery:offer:${orderId}:tried`; 


redis.defineCommand('takeOffer', {
  numberOfKeys: 1,
  lua: `
    local p = redis.call('HGET', KEYS[1], 'partnerId')
    if not p then return false end
    if ARGV[1] ~= '' and p ~= ARGV[1] then return false end
    local d = redis.call('HGET', KEYS[1], 'distanceKm')
    local r = redis.call('HGET', KEYS[1], 'restaurantId')
    redis.call('DEL', KEYS[1])
    return {p, d, r}
  `,
});

async function createOffer(orderId, partnerId, distanceKm, restaurantId) {
  const created = await redis.hsetnx(offerKey(orderId), 'partnerId', partnerId);
  if (created !== 1) return false;

  const expiresAt = Date.now() + offerTimeoutSeconds * 1000;
  await redis
    .multi()
    .hset(offerKey(orderId), 'distanceKm', distanceKm, 'restaurantId', restaurantId, 'expiresAt', expiresAt)
    .zadd(EXPIRY_KEY, expiresAt, orderId)
    .sadd(triedKey(orderId), partnerId)
    .expire(triedKey(orderId), TRIED_TTL_SECONDS)
    .exec();
  return true;
}

async function takeOffer(orderId, partnerId = '') {
  const result = await redis.takeOffer(offerKey(orderId), partnerId);
  if (!result) return null;
  const [owner, distanceKm, restaurantId] = result;
  return { partnerId: owner, distanceKm: parseFloat(distanceKm), restaurantId };
}

async function hasOffer(orderId) {
  return (await redis.exists(offerKey(orderId))) === 1;
}

async function getOffer(orderId) {
  const o = await redis.hgetall(offerKey(orderId));
  if (!o.partnerId) return null;
  return {
    partnerId: o.partnerId,
    distanceKm: parseFloat(o.distanceKm),
    restaurantId: o.restaurantId,
    expiresAt: Number(o.expiresAt),
  };
}

async function triedPartners(orderId) {
  return redis.smembers(triedKey(orderId));
}

async function clear(orderId) {
  await redis.multi().del(triedKey(orderId)).zrem(EXPIRY_KEY, orderId).exec();
}

async function claimExpired(limit = 10) {
  const dueIds = await redis.zrangebyscore(EXPIRY_KEY, '-inf', Date.now(), 'LIMIT', 0, limit);
  const claimed = [];
  for (const orderId of dueIds) {
    if ((await redis.zrem(EXPIRY_KEY, orderId)) === 1) claimed.push(orderId);
  }
  return claimed;
}

module.exports = { createOffer, takeOffer, hasOffer, getOffer, triedPartners, clear, claimExpired };