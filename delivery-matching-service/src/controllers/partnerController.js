const locationService = require('../services/locationService');

async function reportLocation(req, res) {
  const { lat, lng } = req.body;
  const result = await locationService.reportLocation(req.userId, lat, lng);
  res.json(result);
}

async function goOffline(req, res) {
  await locationService.goOffline(req.userId);
  res.status(204).send();
}

module.exports = { reportLocation, goOffline };