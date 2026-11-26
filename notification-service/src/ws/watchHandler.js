const hub = require('./hub');
const orderAccess = require('../services/orderAccess');
const { isUuid, MAX_CHANNELS_PER_SOCKET } = require('./validation');

async function handleWatch(socket, rawRestaurantId) {
  const fail = (reason) => hub.send(socket, { type: 'watch-error', restaurantId: rawRestaurantId, reason });

  if (socket.user.role !== 'RESTAURANT_OWNER') return fail('FORBIDDEN');
  if (!isUuid(rawRestaurantId)) return fail('NOT_FOUND');

  const restaurantId = rawRestaurantId.toLowerCase();
  const channel = hub.restaurantChannel(restaurantId);
  const confirm = () => hub.send(socket, { type: 'watching', restaurantId });
  if (socket.channels.has(channel)) return confirm();
  if (socket.channels.size >= MAX_CHANNELS_PER_SOCKET) return fail('TOO_MANY');

  let owns;
  try {
    owns = await orderAccess.ownsRestaurant(socket.token, restaurantId);
  } catch (err) {
    return fail('UNAVAILABLE');
  }
  if (!owns) return fail('NOT_FOUND');

  if (socket.readyState !== socket.OPEN) return undefined;

  hub.subscribe(channel, socket);
  return confirm();
}

function handleUnwatch(socket, rawRestaurantId) {
  if (typeof rawRestaurantId !== 'string') return;
  hub.unsubscribe(hub.restaurantChannel(rawRestaurantId.toLowerCase()), socket);
}

module.exports = { handleWatch, handleUnwatch };