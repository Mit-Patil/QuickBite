const pool = require('../config/db');

const ORDER_FLOW = ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'];

async function createAssigned({ orderId, partnerId, restaurantId, restaurantName, pickupDistanceKm }) {
  await pool.query(
    `INSERT INTO deliveries (order_id, partner_id, restaurant_id, restaurant_name, pickup_distance_km)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (order_id) DO NOTHING`,
    [orderId, partnerId, restaurantId, restaurantName, pickupDistanceKm]
  );
}

async function markPickedUp(orderId) {
  await pool.query(
    `UPDATE deliveries
     SET status = 'PICKED_UP', picked_up_at = now(), order_status = 'OUT_FOR_DELIVERY'
     WHERE order_id = $1 AND status = 'ASSIGNED'`,
    [orderId]
  );
}

async function markDelivered(orderId, { deliveryFee = null, earning = null } = {}) {
  await pool.query(
    `UPDATE deliveries
     SET status = 'DELIVERED',
         order_status = 'DELIVERED',
         delivered_at = COALESCE(delivered_at, now()),
         delivery_fee = COALESCE(delivery_fee, $2),
         earning = COALESCE(earning, $3)
     WHERE order_id = $1 AND status IN ('ASSIGNED', 'PICKED_UP', 'DELIVERED')`,
    [orderId, deliveryFee, earning]
  );
}

async function markCancelled(orderId) {
  await pool.query(
    `UPDATE deliveries SET status = 'CANCELLED', cancelled_at = now()
     WHERE order_id = $1 AND status IN ('ASSIGNED', 'PICKED_UP')`,
    [orderId]
  );
}

async function advanceOrderStatus(orderId, orderStatus) {
  await pool.query(
    `UPDATE deliveries SET order_status = $2::text
     WHERE order_id = $1 AND status IN ('ASSIGNED', 'PICKED_UP')
       AND array_position($3::text[], $2::text) > array_position($3::text[], order_status::text)`,
    [orderId, orderStatus, ORDER_FLOW]
  );
}

async function findCurrentForPartner(partnerId, recentCancelMinutes) {
  const { rows } = await pool.query(
    `SELECT d.order_id, d.restaurant_name, d.status, d.order_status, d.pickup_distance_km,
            d.assigned_at, d.picked_up_at, d.cancelled_at
     FROM deliveries d
     WHERE d.partner_id = $1
       AND (d.status IN ('ASSIGNED', 'PICKED_UP')
            OR (d.status = 'CANCELLED'
                AND d.cancelled_at > now() - make_interval(mins => $2)
                AND NOT EXISTS (SELECT 1 FROM deliveries n
                                WHERE n.partner_id = d.partner_id AND n.assigned_at > d.assigned_at)))
     ORDER BY (d.status IN ('ASSIGNED', 'PICKED_UP')) DESC, d.assigned_at DESC
     LIMIT 1`,
    [partnerId, recentCancelMinutes]
  );
  return rows[0] || null;
}


const EVENT_AT = 'COALESCE(d.delivered_at, d.cancelled_at)';
const EVENTS_CTE = `
  WITH events AS (
    SELECT d.partner_id, d.order_id, d.restaurant_name, d.status,
           COALESCE(d.delivered_at, d.cancelled_at) AS event_at,
           d.assigned_at, d.picked_up_at, d.delivered_at, d.cancelled_at,
           d.pickup_distance_km, d.delivery_fee, d.earning
    FROM deliveries d
    WHERE d.status IN ('DELIVERED', 'CANCELLED')
    UNION ALL
    SELECT o.partner_id, o.order_id, o.restaurant_name, o.outcome AS status,
           o.resolved_at AS event_at,
           NULL::timestamptz, NULL::timestamptz, NULL::timestamptz, NULL::timestamptz,
           o.distance_km, NULL::numeric, NULL::numeric
    FROM offer_outcomes o
    WHERE o.outcome IN ('DECLINED', 'TIMED_OUT')
  )`;

const MONTH_FILTER = `
  e.status = ANY($6::text[])
  AND ($1::uuid IS NULL OR e.partner_id = $1::uuid)
  AND e.event_at >= make_timestamptz($2::int, $3::int, 1, 0, 0, 0, 'Asia/Kolkata')
  AND e.event_at <  make_timestamptz($4::int, $5::int, 1, 0, 0, 0, 'Asia/Kolkata')`;

const EVERY_STATUS = ['DELIVERED', 'CANCELLED', 'DECLINED', 'TIMED_OUT'];

async function summarizeMonth(partnerId, range) {
  const { rows } = await pool.query(
    `${EVENTS_CTE}
     SELECT COUNT(*) FILTER (WHERE e.status = 'DELIVERED') AS deliveries,
            COUNT(*) FILTER (WHERE e.status = 'CANCELLED') AS cancelled,
            COUNT(*) FILTER (WHERE e.status IN ('DECLINED', 'TIMED_OUT')) AS declined,
            COALESCE(SUM(e.earning) FILTER (WHERE e.status = 'DELIVERED'), 0) AS total_earning,
            AVG(EXTRACT(EPOCH FROM (e.delivered_at - e.picked_up_at)) / 60) FILTER (WHERE e.status = 'DELIVERED') AS avg_minutes,
            COUNT(DISTINCT (e.delivered_at AT TIME ZONE 'Asia/Kolkata')::date) FILTER (WHERE e.status = 'DELIVERED') AS days_worked
     FROM events e
     WHERE ${MONTH_FILTER}`,
    [partnerId, range.startYear, range.startMonth, range.endYear, range.endMonth, EVERY_STATUS]
  );
  return rows[0];
}

async function findMonth(partnerId, range, statuses, limit, offset) {
  const { rows } = await pool.query(
    `${EVENTS_CTE}
     SELECT e.partner_id, e.order_id, e.restaurant_name, e.status, e.event_at, e.assigned_at,
            e.picked_up_at, e.delivered_at, e.cancelled_at, e.pickup_distance_km, e.delivery_fee, e.earning
     FROM events e
     WHERE ${MONTH_FILTER}
     ORDER BY e.event_at DESC, e.order_id
     LIMIT $7 OFFSET $8`,
    [partnerId, range.startYear, range.startMonth, range.endYear, range.endMonth, statuses, limit, offset]
  );
  return rows;
}

async function acceptanceStats(partnerId, range) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE o.outcome = 'ACCEPTED') AS accepted, COUNT(*) AS offers
     FROM offer_outcomes o
     WHERE ($1::uuid IS NULL OR o.partner_id = $1::uuid)
       AND o.resolved_at >= make_timestamptz($2::int, $3::int, 1, 0, 0, 0, 'Asia/Kolkata')
       AND o.resolved_at <  make_timestamptz($4::int, $5::int, 1, 0, 0, 0, 'Asia/Kolkata')`,
    [partnerId, range.startYear, range.startMonth, range.endYear, range.endMonth]
  );
  return rows[0];
}

async function listPartnersWithDeliveries() {
  const { rows } = await pool.query(
    `SELECT partner_id,
            COUNT(*) FILTER (WHERE status = 'DELIVERED') AS deliveries,
            MAX(delivered_at) AS last_delivered_at
     FROM deliveries
     GROUP BY partner_id
     ORDER BY MAX(delivered_at) DESC NULLS LAST`
  );
  return rows;
}

async function recordOutcome({ orderId, partnerId, outcome, restaurantName, distanceKm }) {
  await pool.query(
    `INSERT INTO offer_outcomes (order_id, partner_id, outcome, restaurant_name, distance_km)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (order_id, partner_id) DO NOTHING`,
    [orderId, partnerId, outcome, restaurantName, distanceKm]
  );
}

module.exports = { createAssigned, markPickedUp, markDelivered, markCancelled, advanceOrderStatus, findCurrentForPartner, summarizeMonth, findMonth, acceptanceStats, listPartnersWithDeliveries, recordOutcome };