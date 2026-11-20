const http = require('http');
const express = require('express');
const { port } = require('./config/env');
const { startConsumer, stopConsumer } = require('./kafka/consumer');
const { attachWebSocket } = require('./ws/wsServer');

const app = express();
const server = http.createServer(app);
const wss = attachWebSocket(server);

app.get('/health', (req, res) =>
  res.json({ status: 'UP', service: 'notification-service', connections: wss.clients.size })
);

async function start() {
  await startConsumer();
  server.listen(port, () => console.log(`notification-service on ${port}`));
}

start().catch((err) => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);

  setTimeout(() => process.exit(1), 5000).unref();

  for (const socket of wss.clients) socket.close(1001, 'Server shutting down');
  wss.close();
  server.close();
  try {
    await stopConsumer();
  } catch (err) {
    console.error('Consumer disconnect failed:', err.message);
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));