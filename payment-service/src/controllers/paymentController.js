const Payment = require('../models/Payment');
const { publish } = require('../kafka/paymentEventPublisher');

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
        const {orderId, restaurantId, amount, method, idempotencyKey} = req.body;
        const customerId = req.userId;

        if(!idempotencyKey){
            return res.status(400).json({error : 'idempotencyKey is required'});
        }

        const existing = await Payment.findOne({idempotencyKey});
        if(existing){
            console.log('Idempotent replay detected for key: ', idempotencyKey, ' - returning existing result');
            return res.status(200).json(existing);
        }


        const chargeResult = simulateCharge(method, amount);

        const payment = await Payment.create({
            orderId,
            customerId,
            restaurantId,
            amount,
            method,
            idempotencyKey,
            status: chargeResult.status,
            transactionRef: chargeResult.transactionRef,
            failureReason: chargeResult.failureReason
        });

        await publish(buildPaymentEvent({
            eventType: chargeResult.status === 'SUCCESS' ? 'PAYMENT_CHARGED' : 'PAYMENT_FAILED',
            orderId: payment.orderId,
            customerId: payment.customerId,
            amount: payment.amount,
            method: payment.method,
            failureReason: payment.failureReason,
        }));

        console.log('Simulating slow response for testing...');
        await new Promise(resolve => setTimeout(resolve, 15000));

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

        await publish(buildPaymentEvent({
            eventType: 'REFUND_SUCCEEDED',
            orderId: payment.orderId,
            customerId: payment.customerId,
            amount: payment.amount,
            method: payment.method,
        }));

        console.log('Refund processed for order: ', orderId);
        res.status(200).json(payment);

    } catch (err) {
        await publish(buildPaymentEvent({
            eventType: 'REFUND_FAILED',
            orderId: req.params.orderId,
            failureReason: err.message,
        }));
         console.error('refundPayment error:', err.message);
        next(err);
    }
}

async function getPaymentByKey(req,res,next){
    try {
        const {idempotencyKey} = req.params;
        const payment = await Payment.findOne({idempotencyKey});

        if(!payment){
            return res.status(404).json({error: 'No payment found for this key'});
        }

        res.status(200).json(payment);
    } catch (err) {
        next(err);        
    }
}

function buildPaymentEvent({ eventType, orderId, customerId, amount, method, failureReason, occurredAt }){
    return {
        eventType,
        orderId,
        customerId: customerId ?? null,
        amount: amount ?? null,
        method: method ?? null,
        failureReason: failureReason ?? null,
        occurredAt: occurredAt ?? new Date().toISOString(),
    };
}

module.exports = {createPayment, refundPayment, getPaymentByKey, buildPaymentEvent};