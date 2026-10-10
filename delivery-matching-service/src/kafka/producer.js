const kafka = require('./kafkaClient');

const producer = kafka.producer();
let connected = false;

async function publish(topic, key, event) {
  try {
    if (!connected) {
      await producer.connect();
      connected = true;
    }
    await producer.send({ topic, messages: [{ key, value: JSON.stringify(event) }] });
  } catch (err) {
    console.error(`Failed to publish ${event.eventType} to ${topic}:`, err.message);
  }
}

module.exports = { publish };