const hub = require('../ws/hub');
const locationStore = require('./locationStore');

const NUDGE_EVENTS = new Set([
  'ORDER_CONFIRMED', 'ORDER_ACCEPTED', 'STATUS_CHANGED', 'ORDER_CANCELLED', 'PAYMENT_FAILED', 'PARTNER_ASSIGNED',
]);

function nudge(event) {
  if (!NUDGE_EVENTS.has(event.eventType)) return;
  const message = { type: 'order-changed', orderId: event.orderId };
  if (event.customerId) hub.broadcast(hub.customerChannel(event.customerId), message);
  if (event.restaurantId) hub.broadcast(hub.restaurantChannel(event.restaurantId), message);
}

function onEvent(event) {
  console.log(`event ${event.eventType} order=${event.orderId}`);
  if (event.status === 'DELIVERED' || event.status === 'CANCELLED') {
    locationStore.clear(event.orderId);
    const channel = hub.orderChannel(event.orderId);
    hub.broadcast(channel, { type: 'tracking-ended', orderId: event.orderId });
    hub.dropChannel(channel);
  }
  nudge(event);
}

function onRiderLocation(event) {
  const point = locationStore.save(event);
  if (!point) return;
  hub.broadcast(hub.orderChannel(event.orderId), locationStore.toMessage(event.orderId, point));
}

module.exports = { onEvent, onRiderLocation };