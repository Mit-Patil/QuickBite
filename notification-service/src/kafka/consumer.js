const kafka = require('./kafkaClient');
const { orderEventsTopic, deliveryEventsTopic, riderLocationsTopic, consumerGroupId } = require('../config/env');
const notifier = require('../services/notifier');
const locationStore = require('../services/locationStore');

const consumer = kafka.consumer({ groupId: consumerGroupId });

const EVENT_TYPES = [
  'ORDER_CONFIRMED', 'ORDER_ACCEPTED', 'STATUS_CHANGED', 'ORDER_CANCELLED', 'PAYMENT_FAILED',
  'DELIVERY_ASSIGNED', 'NO_PARTNER_AVAILABLE', 'NO_PARTNER_FOUND',
];

const handlers = {
  ...Object.fromEntries(EVENT_TYPES.map((type) => [type, notifier.onEvent])),
  RIDER_LOCATION: notifier.onRiderLocation,
};

async function startConsumer() {
  await consumer.connect();
  
  await consumer.subscribe({
    topics: [orderEventsTopic, deliveryEventsTopic, riderLocationsTopic],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      let event;
      try {
        event = JSON.parse(message.value.toString());
      } catch (err) {
        console.error('Skipping unparseable message:', err.message);
        return;
      }

      const handler = handlers[event.eventType];
      if (!handler) return;

      for (const [type, handler] of Object.entries(handlers)) {
        if (typeof handler !== 'function') throw new Error(`No handler function for ${type}`);
      }
      try {
        await handler(event);
      } catch (err) {
        console.error(`${event.eventType} failed for order ${event.orderId}:`, err.message);
      }
    },
  });

  console.log(`Consumer listening on ${orderEventsTopic}, ${deliveryEventsTopic}`);
}

async function stopConsumer() {
  await consumer.disconnect();
}



module.exports = { startConsumer, stopConsumer };