const historyService = require("../services/historyService");

async function getHistory(req, res) {
    const result = await historyService.getHistory(req.userId, req.query);
    res.json(result);
}

module.exports = { getHistory };