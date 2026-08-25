const express = require('express');
const router     = express.Router();
const authenticate = require('../middleware/auth');
const {createPayment} = require('../controllers/paymentController');

router.post('/', authenticate, createPayment);

module.exports = router;