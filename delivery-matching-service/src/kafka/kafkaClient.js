const { Kafka } = require('kafkajs');
const { kafkaBroker } = require('../config/env');

module.exports = new Kafka({
  clientId: 'delivery-matching-service',
  brokers: [kafkaBroker],
});