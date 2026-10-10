const kafka = require('./kafkaClient');
const { orderEventsTopic, consumerGroupId } = require('../config/env');
const matchingService = require('../services/matchingService');

const consumer = kafka.consumer({ groupId: consumerGroupId });

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: orderEventsTopic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      let event;
      try {
        event = JSON.parse(message.value.toString());
      } catch (err) {
        console.error('Skipping unparseable message:', err.message);
        return;
      }

      if (event.eventType !== 'ORDER_CONFIRMED') return;

      try {
        await matchingService.matchOrder(event);
      } catch (err) {
        console.error(`Matching failed for order ${event.orderId}:`, err.message);
      }
    },
  });

  console.log(`Consumer listening on ${orderEventsTopic}`);
}

module.exports = { startConsumer };