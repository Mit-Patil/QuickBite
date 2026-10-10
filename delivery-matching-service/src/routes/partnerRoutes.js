const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const partnerController = require('../controllers/partnerController');

const router = express.Router();

router.use(authenticate, requireRole('DELIVERY_PARTNER'));

router.post('/location', partnerController.reportLocation);
router.post('/offline', partnerController.goOffline);

module.exports = router;