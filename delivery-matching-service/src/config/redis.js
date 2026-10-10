const Redis = require('ioredis');
const { redisUrl } = require('./env');

const redis = new Redis(redisUrl);

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

module.exports = redis;