const { WebSocketServer } = require('ws');
const { allowedOrigins, authTimeoutMs, heartbeatMs } = require('../config/env');
const { verifyToken } = require('../auth/verifyToken');
const hub = require('./hub');

function attachWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket, req) => {
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      socket.close(1008, 'Origin not allowed');
      return;
    }

    socket.channels = new Set();
    socket.user = null;
    socket.isAlive = true;

    const authTimer = setTimeout(() => socket.close(4401, 'Authentication timeout'), authTimeoutMs);

    socket.on('pong', () => { socket.isAlive = true; });

    socket.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(raw.toString());
      } catch (err) {
        socket.close(4400, 'Invalid JSON');
        return;
      }

      if (!socket.user) {
        if (message.type !== 'auth') {
          socket.close(4401, 'Authenticate first');
          return;
        }
        try {
          socket.user = verifyToken(message.token);
        } catch (err) {
          socket.close(4401, err.message);
          return;
        }
        clearTimeout(authTimer);
        const channel = hub.personalChannel(socket.user);
        if (channel) hub.subscribe(channel, socket);
        hub.send(socket, { type: 'ready' });
        return;
      }

    });

    socket.on('close', () => {
      clearTimeout(authTimer);
      hub.unsubscribeAll(socket);
    });

    socket.on('error', (err) => console.error('socket error:', err.message));
  });

  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.isAlive) { socket.terminate(); continue; }
      socket.isAlive = false;
      socket.ping();
    }
  }, heartbeatMs);
  wss.on('close', () => clearInterval(heartbeat));

  return wss;
}

module.exports = { attachWebSocket };