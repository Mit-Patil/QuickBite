const redis = require('../config/redis');
const { heartbeatTtlSeconds } = require('../config/env');
const { ValidationError } = require('../errors/AppError');

const AVAILABLE_KEY = 'partners:available';
const BUSY_TTL_SECONDS = 2 * 60 * 60;

const heartbeatKey = (id) => `partner:${id}:heartbeat`;
const busyKey = (id) => `partner:${id}:busy`;

function assertValidCoordinates(lat, lng) {
  const validLat = typeof lat === 'number' && lat >= -90 && lat <= 90;
  const validLng = typeof lng === 'number' && lng >= -180 && lng <= 180;
  if (!validLat || !validLng) {
    throw new ValidationError('Invalid coordinates');
  }
}

async function reportLocation(partnerId, lat, lng) {
  assertValidCoordinates(lat, lng);

  const isBusy = await redis.exists(busyKey(partnerId));
  const tx = redis.multi().set(heartbeatKey(partnerId), '1', 'EX', heartbeatTtlSeconds);
  if (!isBusy) tx.geoadd(AVAILABLE_KEY, lng, lat, partnerId); 
  await tx.exec();

  return { available: !isBusy };
}

async function markFree(partnerId) {
  await redis.del(busyKey(partnerId));
}

async function goOffline(partnerId) {
  await redis
    .multi()
    .zrem(AVAILABLE_KEY, partnerId)
    .del(heartbeatKey(partnerId), busyKey(partnerId))
    .exec();
}

async function findNearest(lat, lng, radiusKm, limit = 5) {
  assertValidCoordinates(lat, lng);

  const results = await redis.geosearch(
    AVAILABLE_KEY, 'FROMLONLAT', lng, lat,
    'BYRADIUS', radiusKm, 'km', 'ASC', 'WITHDIST'
  );
  if (results.length === 0) return [];

  const pipeline = redis.pipeline();
  results.forEach(([partnerId]) => pipeline.exists(heartbeatKey(partnerId)));
  const alive = await pipeline.exec();

  const fresh = [];
  const stale = [];
  results.forEach(([partnerId, dist], i) => {
    if (alive[i][1] === 1) fresh.push({ partnerId, distanceKm: parseFloat(dist) });
    else stale.push(partnerId);
  });

  if (stale.length > 0) await redis.zrem(AVAILABLE_KEY, ...stale);
  return fresh.slice(0, limit);
}

async function claimPartner(partnerId) {
  const won = await redis.set(busyKey(partnerId), '1', 'EX', BUSY_TTL_SECONDS, 'NX');
  if (won !== 'OK') return false;
  await redis.zrem(AVAILABLE_KEY, partnerId);
  return true;
}

module.exports = { reportLocation, claimPartner, markFree, goOffline, findNearest };