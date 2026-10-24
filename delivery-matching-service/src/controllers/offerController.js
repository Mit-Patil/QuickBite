const matchingService = require('../services/matchingService');

async function currentOffer(req, res) {
  const offer = await matchingService.getCurrentOffer(req.userId);
  if (!offer) return res.status(204).send();
  res.json(offer);
}

async function acceptOffer(req, res) {
  await matchingService.acceptOffer(req.params.orderId, req.userId);
  res.json({ orderId: req.params.orderId });
}

async function declineOffer(req, res) {
  await matchingService.declineOffer(req.params.orderId, req.userId);
  res.status(204).send();
}

module.exports = { currentOffer, acceptOffer, declineOffer };