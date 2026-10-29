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

module.exports = { createAssigned, markPickedUp, markDelivered, markCancelled, advanceOrderStatus, findCurrentForPartner };