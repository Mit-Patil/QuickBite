const channels = new Map();

function subscribe(channel, socket) {
  if (!channels.has(channel)) channels.set(channel, new Set());
  channels.get(channel).add(socket);
  socket.channels.add(channel);
}

function unsubscribe(channel, socket) {
  const sockets = channels.get(channel);
  if (sockets) {
    sockets.delete(socket);
    if (sockets.size === 0) channels.delete(channel);
  }
  socket.channels.delete(channel);
}

function unsubscribeAll(socket) {
  for (const channel of [...socket.channels]) unsubscribe(channel, socket);
}

function send(socket, message) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
}

function broadcast(channel, message) {
  const sockets = channels.get(channel);
  if (!sockets) return;
  for (const socket of sockets) send(socket, message);
}

function personalChannel({ userId, role }) {
  if (role === 'CUSTOMER') return customerChannel(userId);
  if (role === 'DELIVERY_PARTNER') return `partner:${userId}`;
  return null; 
}

const orderChannel = (orderId) => `order:${orderId}`;

function dropChannel(channel) {
  const sockets = channels.get(channel);
  if (!sockets) return;
  for (const socket of sockets) socket.channels.delete(channel);
  channels.delete(channel);
}

const customerChannel = (customerId) => `customer:${customerId}`;
const restaurantChannel = (restaurantId) => `restaurant:${restaurantId}`;

module.exports = { subscribe, unsubscribe, unsubscribeAll, send, broadcast, personalChannel, orderChannel, dropChannel, customerChannel, restaurantChannel };