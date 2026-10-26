const redis = require('../config/redis');
const {
  searchRadiusKm, deliveryEventsTopic, retryDelaySeconds, maxRetryAttempts, maxOffers,
} = require('../config/env');
const locationService = require('./locationService');
const retryQueue = require('./retryQueue');
const offerStore = require('./offerStore');
const deliveryRepository = require('../repositories/deliveryRepository');
const { getRestaurantLocation } = require('../clients/restaurantClient');
const { publish } = require('../kafka/producer');
const { ConflictError } = require('../errors/AppError');

const ASSIGNMENT_TTL_SECONDS = 24 * 60 * 60;
const assignmentKey = (orderId) => `delivery:assignment:${orderId}`;
const cancelledKey = (orderId) => `delivery:cancelled:${orderId}`;

function publishEvent(eventType, orderId, extra = {}) {
  publish(deliveryEventsTopic, orderId, {
    eventType,
    orderId,
    occurredAt: new Date().toISOString(),
    ...extra,
  });
}

async function recordHistory(orderId, action) {
  try {
    await action();
  } catch (err) {
    console.error(`History update failed for order ${orderId}:`, err.message);
  }
}

async function giveUp(orderId, attempts) {
  await retryQueue.remove(orderId);
  await offerStore.clear(orderId);
  publishEvent('NO_PARTNER_FOUND', orderId, { attempts });
  console.warn(`Giving up on order ${orderId} after ${attempts} attempts`);
}

async function scheduleRetryOrGiveUp(orderId, restaurantId, isRetry) {
  const attempts = await retryQueue.incrementAttempts(orderId);
  if (!isRetry) publishEvent('NO_PARTNER_AVAILABLE', orderId, { reason: 'NONE_NEARBY' });

  if (attempts >= maxRetryAttempts) {
    await giveUp(orderId, attempts);
  } else {
    await retryQueue.schedule(orderId, restaurantId, retryDelaySeconds);
  }
}

async function matchOrder({ orderId, restaurantId }, { isRetry = false } = {}) {
  if (await redis.exists(cancelledKey(orderId))) {
    await retryQueue.remove(orderId);
    console.log(`Order ${orderId} is cancelled, not matching`);
    return;
  }

  if (await redis.exists(assignmentKey(orderId))) {
    console.log(`Order ${orderId} already assigned, skipping`);
    return;
  }

  if (await offerStore.hasOffer(orderId)) {
    console.log(`Order ${orderId} already has an offer in flight, skipping`);
    return;
  }

  const tried = await offerStore.triedPartners(orderId);
  if (tried.length >= maxOffers) {
    await giveUp(orderId, tried.length);
    return;
  }

  const { latitude, longitude, name } = await getRestaurantLocation(restaurantId);
  if (latitude == null || longitude == null) {
    console.warn(`Restaurant ${restaurantId} has no coordinates`);
    publishEvent('NO_PARTNER_AVAILABLE', orderId, { reason: 'RESTAURANT_HAS_NO_LOCATION' });
    return;
  }

  const candidates = await locationService.findNearest(latitude, longitude, searchRadiusKm, maxOffers + 1);
  const untried = candidates.filter((c) => !tried.includes(c.partnerId));
  console.log(`Order ${orderId}: ${untried.length} untried candidate(s) within ${searchRadiusKm} km`);

  for (const { partnerId, distanceKm } of untried) {
    if (!(await locationService.claimPartner(partnerId, orderId))) continue;

    const created = await offerStore.createOffer(orderId, partnerId, distanceKm, restaurantId, name);
    if (!created) {
      await locationService.releasePartner(partnerId, orderId);
      return;
    }
    console.log(`Order ${orderId} offered to partner ${partnerId} (${distanceKm} km)${isRetry ? ' [retry]' : ''}`);
    return;
  }

  console.warn(`No untried partner available for order ${orderId}${isRetry ? ' (retry)' : ''}`);
  await scheduleRetryOrGiveUp(orderId, restaurantId, isRetry);
}

async function getCurrentOffer(partnerId) {
  const orderId = await locationService.getBusyOrder(partnerId);
  if (!orderId) return null;
  const offer = await offerStore.getOffer(orderId);
  if (!offer || offer.partnerId !== partnerId) return null;
  return {
    orderId,
    distanceKm: offer.distanceKm,
    secondsLeft: Math.max(0, Math.round((offer.expiresAt - Date.now()) / 1000)),
  };
}

async function acceptOffer(orderId, partnerId) {
  const offer = await offerStore.takeOffer(orderId, partnerId);
  if (!offer) throw new ConflictError('Offer expired, was declined, or is not yours');

  await redis.set(assignmentKey(orderId), partnerId, 'EX', ASSIGNMENT_TTL_SECONDS);

  if (await redis.exists(cancelledKey(orderId))) {
    await releaseForOrder(orderId, 'cancelled');
    return;
  }

  await retryQueue.remove(orderId);
  await offerStore.clear(orderId);
  await recordHistory(orderId, () => deliveryRepository.createAssigned({
    orderId,
    partnerId,
    restaurantId: offer.restaurantId,
    restaurantName: offer.restaurantName,
    pickupDistanceKm: offer.distanceKm,
  }));
  publishEvent('DELIVERY_ASSIGNED', orderId, { partnerId, distanceKm: offer.distanceKm });
  console.log(`Order ${orderId} -> partner ${partnerId} (offer accepted)`);
}

async function declineOffer(orderId, partnerId) {
  const offer = await offerStore.takeOffer(orderId, partnerId);
  if (!offer) throw new ConflictError('Offer expired, was already handled, or is not yours');

  await locationService.releasePartner(partnerId, orderId);
  console.log(`Partner ${partnerId} declined order ${orderId}`);

  matchOrder({ orderId, restaurantId: offer.restaurantId }, { isRetry: true })
    .catch((err) => console.error(`Re-match after decline failed for ${orderId}:`, err.message));
}

async function expireOffer(orderId) {
  const offer = await offerStore.takeOffer(orderId);
  if (!offer) return; 

  await locationService.releasePartner(offer.partnerId, orderId);
  console.log(`Offer for order ${orderId} to partner ${offer.partnerId} timed out`);
  await matchOrder({ orderId, restaurantId: offer.restaurantId }, { isRetry: true });
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
  if (status === 'OUT_FOR_DELIVERY') {
    await recordHistory(orderId, () => deliveryRepository.markPickedUp(orderId));
  }
  if (status === 'DELIVERED') {
    await recordHistory(orderId, () => deliveryRepository.markDelivered(orderId));
    await releaseForOrder(orderId, 'delivered');
  }
}

async function handleCancellation({ orderId }) {
  await redis.set(cancelledKey(orderId), '1', 'EX', ASSIGNMENT_TTL_SECONDS);
  await retryQueue.remove(orderId);
  await recordHistory(orderId, () => deliveryRepository.markCancelled(orderId));

  const offer = await offerStore.takeOffer(orderId);
  if (offer) await locationService.releasePartner(offer.partnerId, orderId);
  await offerStore.clear(orderId);

  console.log(`Order ${orderId} cancelled: removed from retry queue and offers`);
  await releaseForOrder(orderId, 'cancelled');
}

module.exports = {
  matchOrder, handleStatusChange, handleCancellation,
  getCurrentOffer, acceptOffer, declineOffer, expireOffer,
};