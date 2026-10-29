const matchingService = require('../services/matchingService');

async function pickUp(req, res) {
  await matchingService.pickUp(req.params.orderId, req.userId, req.headers.authorization);
  res.json({ orderId: req.params.orderId, status: 'OUT_FOR_DELIVERY' });
}

async function deliver(req, res) {
  const result = await matchingService.deliver(req.params.orderId, req.userId, req.headers.authorization);
  res.json({ orderId: req.params.orderId, status: 'DELIVERED', ...result });
}

async function current(req, res) {
  const delivery = await matchingService.getCurrentDelivery(req.userId);
  if (!delivery) return res.status(204).send();
  res.json(delivery);
}

module.exports = { pickUp, deliver, current };