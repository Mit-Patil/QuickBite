require('dotenv').config();

function required(name){
    const value = process.env[name];
    if(!value){
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

module.exports = {
  port: process.env.PORT || 8084,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9094',
  jwtSecret: required('JWT_SECRET'),
  internalSecret: required('INTERNAL_SERVICE_SECRET'),
  restaurantServiceUrl: required('RESTAURANT_SERVICE_URL'),
  databaseUrl: required('DATABASE_URL'),
  orderEventsTopic: 'order-events',
  deliveryEventsTopic: 'delivery-events',
  consumerGroupId: 'delivery-matching-service-consumers',
  retryDelaySeconds: 15,
  retryTickMs: 5000,
  maxRetryAttempts: 6,
  offerTimeoutSeconds: 40,
  maxOffers: 4,
  offerTickMs: 2000,

  heartbeatTtlSeconds: 30,
  searchRadiusKm: 5,
};