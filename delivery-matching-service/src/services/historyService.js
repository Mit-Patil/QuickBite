const deliveryRepository = require('../repositories/deliveryRepository');
const { ValidationError } = require('../errors/AppError');

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const MAX_PAGE_SIZE = 50;

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

function currentMonthIST() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year').value;
  const month = parts.find((p) => p.type === 'month').value;
  return `${year}-${month}`;
}

function parseQuery({ month, page, size }) {
  const monthText = month || currentMonthIST();
  const match = MONTH_PATTERN.exec(monthText);
  if (!match) throw new ValidationError('month must look like 2026-10');

  const pageNumber = page === undefined ? 0 : Number(page);
  const pageSize = size === undefined ? 10 : Number(size);
  if (!Number.isInteger(pageNumber) || pageNumber < 0) {
    throw new ValidationError('page must be 0 or more');
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new ValidationError(`size must be between 1 and ${MAX_PAGE_SIZE}`);
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  const next = monthNumber === 12
    ? { year: year + 1, month: 1 }
    : { year, month: monthNumber + 1 };

  return {
    monthText, pageNumber, pageSize,
    range: { startYear: year, startMonth: monthNumber, endYear: next.year, endMonth: next.month },
  };
}

async function getHistory(partnerId, query) {
  const { monthText, pageNumber, pageSize, range } = parseQuery(query);

  const [summary, rows] = await Promise.all([
    deliveryRepository.summarizeDelivered(partnerId, range),
    deliveryRepository.findDelivered(partnerId, range, pageSize, pageNumber * pageSize),
  ]);

  const deliveries = Number(summary.deliveries);
  return {
    month: monthText,
    page: pageNumber,
    size: pageSize,
    totalPages: Math.ceil(deliveries / pageSize),
    summary: {
      deliveries,
      totalEarning: toNumber(summary.total_earning),
      averageMinutes: summary.avg_minutes === null ? null : Math.round(Number(summary.avg_minutes) * 10) / 10,
      daysWorked: Number(summary.days_worked),
    },
    items: rows.map((r) => ({
      orderId: r.order_id,
      restaurantName: r.restaurant_name,
      assignedAt: r.assigned_at,
      pickedUpAt: r.picked_up_at,
      deliveredAt: r.delivered_at,
      pickupDistanceKm: toNumber(r.pickup_distance_km),
      deliveryFee: toNumber(r.delivery_fee),
      earning: toNumber(r.earning),
    })),
  };
}

module.exports = { getHistory };