const MAX_AGE_MS = 5 * 60 * 1000;
const lastByOrder = new Map();

function save(event) {
  const sentAt = Date.parse(event.occurredAt);
  if (Number.isNaN(sentAt) || Date.now() - sentAt > MAX_AGE_MS) return null;

  const current = lastByOrder.get(event.orderId);
  if (current && sentAt <= current.sentAt) return null;

  const point = { lat: event.lat, lng: event.lng, phase: event.phase, sentAt };
  lastByOrder.set(event.orderId, point);
  return point;
}

function getLast(orderId) {
  const point = lastByOrder.get(orderId);
  if (!point) return null;
  if (Date.now() - point.sentAt > MAX_AGE_MS) {
    lastByOrder.delete(orderId);
    return null;
  }
  return point;
}

function clear(orderId) {
  lastByOrder.delete(orderId);
}

function toMessage(orderId, point) {
  return { type: 'location', orderId, lat: point.lat, lng: point.lng, phase: point.phase, at: point.sentAt };
}

setInterval(() => {
  const cutoff = Date.now() - MAX_AGE_MS;
  for (const [orderId, point] of lastByOrder) {
    if (point.sentAt < cutoff) lastByOrder.delete(orderId);
  }
}, 60 * 1000).unref();

module.exports = { save, getLast, clear, toMessage };