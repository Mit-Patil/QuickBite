const historyService = require('../services/historyService');
const { ValidationError } = require('../errors/AppError');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getHistory(req, res) {
  const { partnerId, ...query } = req.query;
  if (partnerId !== undefined && !UUID_PATTERN.test(partnerId)) {
    throw new ValidationError('partnerId must be a valid id');
  }
  res.json(await historyService.getHistory(partnerId || null, query));
}

async function listPartners(req, res) {
  res.json(await historyService.listPartners());
}

module.exports = { getHistory, listPartners };