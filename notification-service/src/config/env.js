require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  port: Number(process.env.PORT || 8085),
  kafkaBroker: process.env.KAFKA_BROKER || '127.0.0.1:9094',
  jwtSecret: required('JWT_SECRET'),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  orderEventsTopic: 'order-events',
  deliveryEventsTopic: 'delivery-events',
  consumerGroupId: 'notification-service-consumers',
  authTimeoutMs: 5000,
  heartbeatMs: 30000,
};