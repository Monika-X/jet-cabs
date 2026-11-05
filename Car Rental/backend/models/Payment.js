const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    method: {
      type: String,
      required: true,
      enum: ['card', 'upi', 'wallet', 'paypal', 'bank_transfer', 'cash', 'mobile_money']
    },
    transactionId: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['CREATED', 'PROCESSING', 'SUCCESS', 'FAILED'],
      default: 'CREATED'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
