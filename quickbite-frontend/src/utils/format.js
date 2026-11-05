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

export function formatMinutes(value) {
  return value === null || value === undefined ? '–' : `${value} min`;
}

export function formatRupees(value) {
  return value === null || value === undefined ? '–' : `₹${formatPrice(value)}`;
}

export function currentMonthKey() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit',
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}`;
}

export const shortPartnerId = shortOrderId;