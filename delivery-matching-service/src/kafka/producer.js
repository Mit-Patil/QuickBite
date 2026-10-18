const kafka = require('./kafkaClient');

const producer = kafka.producer();
let connecting = null;

function ensureConnected() {
  if (!connecting) {
    connecting = producer.connect().catch((err) => {
      connecting = null;
      throw err;
    });
  }
  return connecting;
}

async function publish(topic, key, event) {
  try {
    await ensureConnected();
    await producer.send({ topic, messages: [{ key, value: JSON.stringify(event) }] });
  } catch (err) {
    console.error(`Failed to publish ${event.eventType} to ${topic}:`, err.message);
  }
}

module.exports = { publish };