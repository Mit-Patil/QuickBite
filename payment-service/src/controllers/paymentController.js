const payment = require('../models/Payment');

function simulateCharge(method, amount){
    if(method == 'COD'){
        return {status : 'SUCCESS', transactionRef: `cod_${Date.now()}`, failureReason: null};
    }

    const success = Math.random() > 0.1;

    return{
        status: success ? 'SUCCESS' : 'FAILED',
        transactionRef: success ? `sim_txn_${Date.now()}` : null,
        failureReason: success ? null : 'Simulated Gateway Decline'
    };
}

async function createPayment(req, res, next){
    try {
        const {orderId, customerId, restaurantId, amount, method} = req.body;
        const chargeResult = simulateCharge(method, amount);

        const payment = await Payment.create({
            orderId,
            customerId,
            restaurantId,
            amount,
            method,
            status: chargeResult.status,
            transactionRef: chargeResult.transactionRef,
            failureReason: chargeResult.failureReason
        });

        res.status(201).json(payment);
    } catch (err) {
        next(err);
    }
}

module.exports = {createPayment};