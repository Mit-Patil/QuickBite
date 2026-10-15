const redis = require('../config/redis');
const { searchRadiusKm, deliveryEventsTopic, retryDelaySeconds, maxRetryAttempts } = require('../config/env');
const locationService = require('./locationService');
const retryQueue = require('./retryQueue');
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

async function matchOrder({ orderId, restaurantId }, { isRetry = false } = {}) {
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
    if (await locationService.claimPartner(partnerId, orderId)) {
      await redis.set(assignmentKey(orderId), partnerId, 'EX', ASSIGNMENT_TTL_SECONDS);
      await retryQueue.remove(orderId); // drops the attempt counter too
      await publishEvent('DELIVERY_ASSIGNED', orderId, { partnerId, distanceKm });
      console.log(`Order ${orderId} -> partner ${partnerId} (${distanceKm} km)${isRetry ? ' [retry]' : ''}`);
      return;
    }
  }

  console.warn(`No partner available for order ${orderId}${isRetry ? ' (retry)' : ''}`);
  if (!isRetry) await publishEvent('NO_PARTNER_AVAILABLE', orderId, { reason: 'NONE_NEARBY' });

  const attempts = await retryQueue.incrementAttempts(orderId);
  if (attempts >= maxRetryAttempts) {
    await retryQueue.remove(orderId);
    await publishEvent('NO_PARTNER_FOUND', orderId, { attempts });
    console.warn(`Giving up on order ${orderId} after ${attempts} attempts`);
    return;
  }
  await retryQueue.schedule(orderId, restaurantId, retryDelaySeconds);
}

async function releaseForOrder(orderId, reason) {
  const partnerId = await redis.get(assignmentKey(orderId));
  if (!partnerId) return;

  const released = await locationService.releasePartner(partnerId, orderId);
  console.log(
    released
      ? `Partner ${partnerId} released (order ${orderId} ${reason})`
      : `Partner ${partnerId} not released: no longer busy with order ${orderId}`
  );
}

async function handleStatusChange({ orderId, status }) {
  if (status !== 'DELIVERED') return;
  await releaseForOrder(orderId, 'delivered');
}

async function handleCancellation({ orderId }) {
  await retryQueue.remove(orderId);
  await releaseForOrder(orderId, 'cancelled');
}

module.exports = { matchOrder, handleStatusChange, handleCancellation };