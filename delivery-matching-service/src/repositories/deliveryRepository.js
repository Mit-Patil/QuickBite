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


const MONTH_FILTER = `
  d.status = 'DELIVERED'
  AND ($1::uuid IS NULL OR d.partner_id = $1::uuid)
  AND d.delivered_at >= make_timestamptz($2::int, $3::int, 1, 0, 0, 0, 'Asia/Kolkata')
  AND d.delivered_at <  make_timestamptz($4::int, $5::int, 1, 0, 0, 0, 'Asia/Kolkata')`;

async function summarizeDelivered(partnerId, range) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS deliveries,
            COALESCE(SUM(d.earning), 0) AS total_earning,
            AVG(EXTRACT(EPOCH FROM (d.delivered_at - d.picked_up_at)) / 60) AS avg_minutes,
            COUNT(DISTINCT (d.delivered_at AT TIME ZONE 'Asia/Kolkata')::date) AS days_worked
     FROM deliveries d
     WHERE ${MONTH_FILTER}`,
    [partnerId, range.startYear, range.startMonth, range.endYear, range.endMonth]
  );
  return rows[0];
}

async function findDelivered(partnerId, range, limit, offset) {
  const { rows } = await pool.query(
    `SELECT d.order_id, d.restaurant_name, d.assigned_at, d.picked_up_at, d.delivered_at,
            d.pickup_distance_km, d.delivery_fee, d.earning
     FROM deliveries d
     WHERE ${MONTH_FILTER}
     ORDER BY d.delivered_at DESC, d.order_id
     LIMIT $6 OFFSET $7`,
    [partnerId, range.startYear, range.startMonth, range.endYear, range.endMonth, limit, offset]
  );
  return rows;
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

module.exports = { createAssigned, markPickedUp, markDelivered, markCancelled, advanceOrderStatus, findCurrentForPartner, summarizeDelivered, findDelivered, listPartnersWithDeliveries };