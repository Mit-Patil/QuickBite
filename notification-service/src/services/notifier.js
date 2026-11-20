function onEvent(event) {
  console.log(`event ${event.eventType} order=${event.orderId}`);
}

module.exports = { onEvent };