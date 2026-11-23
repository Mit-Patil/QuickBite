// Dev helper: log in, open the notification socket, track one order and print what arrives.
// Usage: node scripts/track-check.js <email> <password> <orderId> [seconds=30] [untrackAfterSeconds]
require('dotenv').config();
const WebSocket = require('ws');

const [email, password, orderId, secondsArg, untrackArg] = process.argv.slice(2);
if (!email || !password || !orderId) {
  console.error('Usage: node scripts/track-check.js <email> <password> <orderId> [seconds=30] [untrackAfterSeconds]');
  process.exit(1);
}

const userUrl = process.env.USER_SERVICE_URL || 'http://127.0.0.1:8081';
const socketUrl = `ws://127.0.0.1:${process.env.PORT || 8085}/ws`;

async function main() {
  const response = await fetch(`${userUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`login failed with status ${response.status}`);
  const { token } = await response.json();

  const started = Date.now();
  const stamp = () => `${((Date.now() - started) / 1000).toFixed(1)}s`;
  const socket = new WebSocket(socketUrl);

  socket.on('open', () => socket.send(JSON.stringify({ type: 'auth', token })));
  socket.on('message', (raw) => {
    console.log(stamp(), raw.toString());
    if (JSON.parse(raw.toString()).type === 'ready') {
      socket.send(JSON.stringify({ type: 'track', orderId }));
    }
  });
  socket.on('close', (code, reason) => {
    console.log(stamp(), 'closed', code, reason.toString());
    process.exit(0);
  });

  if (untrackArg) {
    setTimeout(() => {
      console.log(stamp(), 'sending untrack');
      socket.send(JSON.stringify({ type: 'untrack', orderId }));
    }, Number(untrackArg) * 1000);
  }
  setTimeout(() => socket.close(), Number(secondsArg || 30) * 1000);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});