const matchingService = require('../services/matchingService');

async function pickUp(req, res) {
  await matchingService.pickUp(req.params.orderId, req.userId, req.headers.authorization);
  res.json({ orderId: req.params.orderId, status: 'OUT_FOR_DELIVERY' });
}

async function deliver(req, res) {
  const result = await matchingService.deliver(req.params.orderId, req.userId, req.headers.authorization);
  res.json({ orderId: req.params.orderId, status: 'DELIVERED', ...result });
}

module.exports = { pickUp, deliver };