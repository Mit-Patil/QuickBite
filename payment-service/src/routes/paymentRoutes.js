const express = require('express');
const router     = express.Router();
const authenticate = require('../middleware/auth');
const {createPayment, refundPayment, getPaymentByKey} = require('../controllers/paymentController');
const internalAuthenticate = require('../middleware/internalAuth');

router.post('/', authenticate, createPayment);
router.post('/:orderId/refund', internalAuthenticate, refundPayment);
router.get('/status/:idempotencyKey', internalAuthenticate, getPaymentByKey);
module.exports = router;