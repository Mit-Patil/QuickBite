const { publish } = require('../kafka/producer');
const { riderLocationsTopic } = require('../config/env');
const locationService = require('./locationService');
const deliveryRepository = require('../repositories/deliveryRepository');

const PHASE_BY_STATUS = {
  ASSIGNED: 'TO_RESTAURANT',
  PICKED_UP: 'TO_CUSTOMER',
};

async function publishLocation(partnerId, lat, lng) {
  try {
    const busyOrderId = await locationService.getBusyOrder(partnerId);
    if (!busyOrderId) return;

    const delivery = await deliveryRepository.findCurrentForPartner(partnerId, 0);
    const phase = delivery && PHASE_BY_STATUS[delivery.status];
    if (!phase) return;

    await publish(riderLocationsTopic, delivery.order_id, {
      eventType: 'RIDER_LOCATION',
      orderId: delivery.order_id,
      lat,
      lng,
      phase,
      occurredAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Rider location publish failed:', err.message);
  }
}

module.exports = { publishLocation };