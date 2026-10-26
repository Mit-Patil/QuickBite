const redis = require('../config/redis');
const pool = require('../config/db');
const { startWorker } = require('../utils/intervalWorker');

async function countKeys(pattern) {
  const seen = new Set();
  let cursor = '0';
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    keys.forEach((k) => seen.add(k));
    cursor = next;
  } while (cursor !== '0');
  return seen.size;
}

async function takeSnapshot() {
  const online = await countKeys('partner:*:heartbeat');
  const busy = await countKeys('partner:*:busy');
  await pool.query(
    `INSERT INTO partner_snapshots (taken_at, online, busy)
     VALUES (date_trunc('minute', now()), $1, $2)
     ON CONFLICT (taken_at) DO NOTHING`,
    [online, busy]
  );
}

function startSnapshotWorker() {
  startWorker('Snapshot worker', 60 * 1000, takeSnapshot);
}

module.exports = { startSnapshotWorker };