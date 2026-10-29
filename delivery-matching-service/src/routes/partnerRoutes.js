const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const partnerController = require('../controllers/partnerController');
const offerController = require('../controllers/offerController');
const deliveryController = require('../controllers/deliveryController');

const router = express.Router();

router.use(authenticate, requireRole('DELIVERY_PARTNER'));

router.post('/location', partnerController.reportLocation);
router.post('/offline', partnerController.goOffline);

router.get('/offers/current', offerController.currentOffer);
router.post('/offers/:orderId/accept', offerController.acceptOffer);
router.post('/offers/:orderId/decline', offerController.declineOffer);

router.post('/orders/:orderId/pickup', deliveryController.pickUp);
router.post('/orders/:orderId/deliver', deliveryController.deliver);
router.get('/orders/current', deliveryController.current);

module.exports = router;