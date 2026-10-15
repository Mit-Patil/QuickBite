const redis = require('../config/redis');

const QUEUE_KEY = 'delivery:retry';                  
const RESTAURANT_KEY = 'delivery:retry:restaurant';  
const ATTEMPTS_KEY = 'delivery:retry:attempts';      

async function schedule(orderId, restaurantId, delaySeconds) {
  const dueAt = Date.now() + delaySeconds * 1000;
  await redis
    .multi()
    .zadd(QUEUE_KEY, dueAt, orderId)
    .hset(RESTAURANT_KEY, orderId, restaurantId)
    .exec();
}

async function incrementAttempts(orderId) {
  return redis.hincrby(ATTEMPTS_KEY, orderId, 1);
}

async function remove(orderId) {
  await redis
    .multi()
    .zrem(QUEUE_KEY, orderId)
    .hdel(RESTAURANT_KEY, orderId)
    .hdel(ATTEMPTS_KEY, orderId)
    .exec();
}

async function claimDue(limit = 10) {
  const dueIds = await redis.zrangebyscore(QUEUE_KEY, '-inf', Date.now(), 'LIMIT', 0, limit);
  const claimed = [];
  for (const orderId of dueIds) {
    if ((await redis.zrem(QUEUE_KEY, orderId)) === 1) {
      const restaurantId = await redis.hget(RESTAURANT_KEY, orderId);
      await redis.hdel(RESTAURANT_KEY, orderId);  
      claimed.push({ orderId, restaurantId });
    }
  }
  return claimed;
}

module.exports = { schedule, incrementAttempts, remove, claimDue };