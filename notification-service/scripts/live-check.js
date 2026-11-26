// Dev helper: log in, open the notification socket and print everything that arrives.
// Usage: node scripts/live-check.js <email> <password> [seconds=60] [--track=<orderId>] [--watch=<restaurantId>] [--untrack-after=<seconds>]
require('dotenv').config();
const WebSocket = require('ws');

const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args.filter((arg) => arg.startsWith('--')).map((arg) => {
    const [key, value = ''] = arg.slice(2).split('=');
    return [key, value];
  })
);
const [email, password, secondsArg] = args.filter((arg) => !arg.startsWith('--'));

if (!email || !password) {
  console.error('Usage: node scripts/live-check.js <email> <password> [seconds=60] [--track=<orderId>] [--watch=<restaurantId>] [--untrack-after=<seconds>]');
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
  const send = (message) => socket.send(JSON.stringify(message));

  socket.on('open', () => send({ type: 'auth', token }));
  socket.on('message', (raw) => {
    console.log(stamp(), raw.toString());
    if (JSON.parse(raw.toString()).type !== 'ready') return;
    if (flags.track) send({ type: 'track', orderId: flags.track });
    if (flags.watch) send({ type: 'watch', restaurantId: flags.watch });
  });
  socket.on('close', (code, reason) => {
    console.log(stamp(), 'closed', code, reason.toString());
    process.exit(0);
  });

  if (flags['untrack-after'] && flags.track) {
    setTimeout(() => {
      console.log(stamp(), 'sending untrack');
      send({ type: 'untrack', orderId: flags.track });
    }, Number(flags['untrack-after']) * 1000);
  }
  setTimeout(() => socket.close(), Number(secondsArg || 60) * 1000);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});