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


async function refundPayment(req,res,next){
    try {
        const {orderId} = req.params;

        const payment = await Payment.findOne({orderId, status: 'SUCCESS'});

        if(!payment){
            return res.status(404).json({error: 'No Successful payment found for this order'});
        }

        payment.status = 'REFUNDED';
        await payment.save();

        console.log('Refund processed for order: ', orderId);
        res.status(200).json(payment);

    } catch (err) {
         console.error('refundPayment error:', err.message);
        next(err);
    }
}

module.exports = {createPayment, refundPayment};