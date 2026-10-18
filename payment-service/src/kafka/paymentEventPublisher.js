const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'payment-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9094'],
});

const producer = kafka.producer();
let connecting  = null;

function ensureConnected() {                    
  if (!connecting) {
    connecting = producer.connect().catch((err) => {
      connecting = null;                        
      throw err;
    });
  }
  return connecting;
}

async function send(event) {                    
  try {
    await ensureConnected();
    await producer.send({
      topic: 'payment-events',
      messages: [{ key: event.orderId, value: JSON.stringify(event) }],
    });
  } catch (err) {
    console.error(`Failed to publish PaymentEvent for order ${event.orderId}:`, err.message);
  }
}

function publish(event) {                       
  send(event);
  return Promise.resolve();                     
}

module.exports = { publish };