const hub = require('./hub');
const locationStore = require('../services/locationStore');
const orderAccess = require('../services/orderAccess');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TRACKABLE = new Set(['CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY']);
const MAX_CHANNELS_PER_SOCKET = 10;

function confirm(socket, orderId) {
  hub.send(socket, { type: 'tracking', orderId });
  const last = locationStore.getLast(orderId);
  if (last) hub.send(socket, locationStore.toMessage(orderId, last));
}

async function handleTrack(socket, rawOrderId) {
  const fail = (reason) => hub.send(socket, { type: 'track-error', orderId: rawOrderId, reason });

  if (socket.user.role !== 'CUSTOMER') return fail('FORBIDDEN');
  if (typeof rawOrderId !== 'string' || !UUID.test(rawOrderId)) return fail('NOT_FOUND');

  const orderId = rawOrderId.toLowerCase();
  const channel = hub.orderChannel(orderId);
  if (socket.channels.has(channel)) return confirm(socket, orderId);
  if (socket.channels.size >= MAX_CHANNELS_PER_SOCKET) return fail('TOO_MANY');

  let order;
  try {
    order = await orderAccess.getOrderForCustomer(socket.token, orderId);
  } catch (err) {
    return fail('UNAVAILABLE');
  }
  if (!order) return fail('NOT_FOUND');
  if (!TRACKABLE.has(order.status)) return fail('NOT_TRACKABLE');

  if (socket.readyState !== socket.OPEN) return undefined;

  hub.subscribe(channel, socket);
  return confirm(socket, orderId);
}

function handleUntrack(socket, rawOrderId) {
  if (typeof rawOrderId !== 'string') return;
  hub.unsubscribe(hub.orderChannel(rawOrderId.toLowerCase()), socket);
}

module.exports = { handleTrack, handleUntrack };