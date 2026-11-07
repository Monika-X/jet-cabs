const Payment = require('../models/Payment');

/**
 * @desc    Get all payment orders for the logged-in customer
 * @route   GET /api/payments/orders
 * @access  Private
 */
const getPaymentOrders = async (req, res, next) => {
  try {
    const payments = await Payment.find({ customer: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a payment order
 * @route   POST /api/payments/orders
 * @access  Private
 */
const createPaymentOrder = async (req, res, next) => {
  try {
    const { amount, method } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      res.status(400);
      return next(new Error('A valid payment amount is required.'));
    }
    if (!method) {
      res.status(400);
      return next(new Error('A payment method is required.'));
    }

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const payment = await Payment.create({
      customer: req.user._id,
      orderId,
      amount: Number(amount),
      method
    });

    res.status(201).json({
      success: true,
      message: 'Payment order created.',
      data: {
        orderId: payment.orderId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Process a payment order (sandbox gateway simulation, server-side)
 * @route   POST /api/payments/orders/:orderId/process
 * @access  Private
 */
const processPaymentOrder = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (!payment) {
      res.status(404);
      return next(new Error('Payment order not found.'));
    }
    if (String(payment.customer) !== String(req.user._id)) {
      res.status(403);
      return next(new Error('Not authorized to access this payment order.'));
    }
    if (payment.status === 'SUCCESS' || payment.status === 'FAILED') {
      res.status(409);
      return next(new Error(`Payment order is already ${payment.status.toLowerCase()}.`));
    }

    payment.status = 'PROCESSING';
    payment.transactionId = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment processed.',
      data: {
        orderId: payment.orderId,
        transactionId: payment.transactionId,
        status: payment.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify a payment order
 * @route   GET /api/payments/orders/:orderId/verify
 * @access  Private
 */
const verifyPaymentOrder = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (!payment) {
      res.status(404);
      return next(new Error('Payment order not found.'));
    }
    if (String(payment.customer) !== String(req.user._id)) {
      res.status(403);
      return next(new Error('Not authorized to access this payment order.'));
    }
    if (payment.status === 'PROCESSING') {
      payment.status = 'SUCCESS';
      await payment.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified.',
      data: {
        orderId: payment.orderId,
        transactionId: payment.transactionId,
        status: payment.status
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPaymentOrders, createPaymentOrder, processPaymentOrder, verifyPaymentOrder };
