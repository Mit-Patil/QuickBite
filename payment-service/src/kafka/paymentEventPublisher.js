const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'payment-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9094'],
});

const producer = kafka.producer();
let connected = false;

async function ensureConnected() {
  if (!connected) {
    await producer.connect();
    connected = true;
  }
}

async function publish(event) {
  try {
    await ensureConnected();
    await producer.send({
      topic: 'payment-events',
      messages: [
        {
          key: event.orderId,          
          value: JSON.stringify(event),
        },
      ],
    });
  } catch (err) {
    console.error(`Failed to publish PaymentEvent for order ${event.orderId}:`, err.message);
  }
}

module.exports = { publish };