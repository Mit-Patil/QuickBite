const channels = new Map();

function subscribe(channel, socket) {
  if (!channels.has(channel)) channels.set(channel, new Set());
  channels.get(channel).add(socket);
  socket.channels.add(channel);
}

function unsubscribeAll(socket) {
  for (const channel of socket.channels) {
    const sockets = channels.get(channel);
    if (!sockets) continue;
    sockets.delete(socket);
    if (sockets.size === 0) channels.delete(channel);
  }
  socket.channels.clear();
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
  if (role === 'CUSTOMER') return `customer:${userId}`;
  if (role === 'DELIVERY_PARTNER') return `partner:${userId}`;
  return null; 
}

module.exports = { subscribe, unsubscribeAll, send, broadcast, personalChannel };