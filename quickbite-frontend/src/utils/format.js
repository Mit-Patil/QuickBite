export function formatPrice(value) {
  return Number(value ?? 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function shortOrderId(id) {
  return id ? `#${String(id).slice(0, 8).toUpperCase()}` : '';
}

export function formatTime(value) {
  if (!value) return '';
  const [h, m] = value.split(':');
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}