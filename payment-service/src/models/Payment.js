const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({

    orderId:{
        type: String,
        required: true,
        index: true
    },
    customerId: {
        type: String,
        required: true
    },
    restaurantId:{
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ['CARD', 'UPI', 'COD', 'WALLET'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },
    failureReason: {
        type: String
    },
    transactionRef: {
        type: String
    }
},{
    timestamps:true
});

module.exports = mongoose.model('Payment', paymentSchema);