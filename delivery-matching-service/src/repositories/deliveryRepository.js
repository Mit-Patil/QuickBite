const pool = require('../config/db');

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
    `UPDATE deliveries SET status = 'PICKED_UP', picked_up_at = now()
     WHERE order_id = $1 AND status = 'ASSIGNED'`,
    [orderId]
  );
}

async function markDelivered(orderId, { deliveryFee = null, earning = null } = {}) {
  await pool.query(
    `UPDATE deliveries
     SET status = 'DELIVERED',
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

module.exports = { createAssigned, markPickedUp, markDelivered, markCancelled };