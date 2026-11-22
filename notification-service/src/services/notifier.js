const hub = require('../ws/hub');
const locationStore = require('./locationStore');

function onEvent(event) {
  console.log(`event ${event.eventType} order=${event.orderId}`);
  if (event.status === 'DELIVERED' || event.status === 'CANCELLED') {
    locationStore.clear(event.orderId);
    const channel = hub.orderChannel(event.orderId);
    hub.broadcast(channel, { type: 'tracking-ended', orderId: event.orderId });
    hub.dropChannel(channel);
  }
}

function onRiderLocation(event) {
  const point = locationStore.save(event);
  if (!point) return;
  hub.broadcast(hub.orderChannel(event.orderId), locationStore.toMessage(event.orderId, point));
}

module.exports = { onEvent, onRiderLocation };