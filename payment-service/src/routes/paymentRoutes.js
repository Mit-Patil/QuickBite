const express = require('express');
const router     = express.Router();
const authenticate = require('../middleware/auth');
const {createPayment, refundPayment} = require('../controllers/paymentController');
const internalAuthenticate = require('../middleware/internalAuth');

router.post('/', authenticate, createPayment);
router.post('/:orderId/refund', internalAuthenticate, refundPayment);

module.exports = router;