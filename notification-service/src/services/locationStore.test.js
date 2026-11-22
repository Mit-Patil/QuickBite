const test = require('node:test');
const assert = require('node:assert');
const store = require('./locationStore');

const point = (orderId, secondsAgo, lng) => ({
  eventType: 'RIDER_LOCATION',
  orderId,
  lat: 21.1,
  lng,
  phase: 'TO_RESTAURANT',
  occurredAt: new Date(Date.now() - secondsAgo * 1000).toISOString(),
});

test('keeps the newest point and ignores older ones (the replay seen in the log)', () => {
  assert.ok(store.save(point('o1', 10, 72.8)));
  assert.ok(store.save(point('o1', 5, 73.4)));
  assert.equal(store.save(point('o1', 8, 72.8)), null);
  assert.equal(store.getLast('o1').lng, 73.4);
});

test('ignores a duplicate with the same timestamp', () => {
  const event = point('o2', 5, 73.4);
  assert.ok(store.save(event));
  assert.equal(store.save(event), null);
});

test('ignores a point that is too old to be live', () => {
  assert.equal(store.save(point('o3', 10 * 60, 72.8)), null);
  assert.equal(store.getLast('o3'), null);
});

test('clear removes the stored point', () => {
  store.save(point('o4', 5, 73.4));
  store.clear('o4');
  assert.equal(store.getLast('o4'), null);
});