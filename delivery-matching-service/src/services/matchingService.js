const redis = require('../config/redis');
const { searchRadiusKm, deliveryEventsTopic } = require('../config/env');
const locationService = require('./locationService');
const { getRestaurantLocation } = require('../clients/restaurantClient');
const { publish } = require('../kafka/producer');

const ASSIGNMENT_TTL_SECONDS = 24 * 60 * 60;
const assignmentKey = (orderId) => `delivery:assignment:${orderId}`;

function publishEvent(eventType, orderId, extra = {}) {
  return publish(deliveryEventsTopic, orderId, {
    eventType,
    orderId,
    occurredAt: new Date().toISOString(),
    ...extra,
  });
}

async function matchOrder({ orderId, restaurantId }) {
  if (await redis.exists(assignmentKey(orderId))) {
    console.log(`Order ${orderId} already assigned, skipping`);
    return;
  }

  const { latitude, longitude } = await getRestaurantLocation(restaurantId);
  if (latitude == null || longitude == null) {
    console.warn(`Restaurant ${restaurantId} has no coordinates`);
    await publishEvent('NO_PARTNER_AVAILABLE', orderId, { reason: 'RESTAURANT_HAS_NO_LOCATION' });
    return;
  }
const candidates = await locationService.findNearest(latitude, longitude, searchRadiusKm, 5);
console.log(`Order ${orderId}: ${candidates.length} candidate(s) within ${searchRadiusKm} km of (${latitude}, ${longitude})`);
  for (const { partnerId, distanceKm } of candidates) {
    if (await locationService.claimPartner(partnerId)) {
      await redis.set(assignmentKey(orderId), partnerId, 'EX', ASSIGNMENT_TTL_SECONDS);
      await publishEvent('DELIVERY_ASSIGNED', orderId, { partnerId, distanceKm });
      console.log(`Order ${orderId} -> partner ${partnerId} (${distanceKm} km)`);
      return;
    }
  }

  console.warn(`No partner available for order ${orderId}`);
  await publishEvent('NO_PARTNER_AVAILABLE', orderId, { reason: 'NONE_NEARBY' });
}

module.exports = { matchOrder };