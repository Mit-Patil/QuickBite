const Payment = require('../models/Payment');

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
        const {orderId, restaurantId, amount, method} = req.body;
        const customerId = req.userId;

        console.log('Payment request body:', req.body, 'customerId:', customerId);

        const chargeResult = simulateCharge(method, amount);
        console.log('Charge result:', chargeResult);


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

        console.log('Payment saved:', payment.status);
        res.status(201).json(payment);
    } catch (err) {
        console.error('createPayment error:', err.message);
        next(err);
    }
}

module.exports = {createPayment};