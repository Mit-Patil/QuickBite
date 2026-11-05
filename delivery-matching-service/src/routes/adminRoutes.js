const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const adminHistoryController = require('../controllers/adminHistoryController');

const router = express.Router();

router.use(authenticate, requireRole('ADMIN'));
router.get('/history', adminHistoryController.getHistory);
router.get('/partners', adminHistoryController.listPartners);

module.exports = router;