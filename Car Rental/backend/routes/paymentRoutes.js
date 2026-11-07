const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getPaymentOrders,
  createPaymentOrder,
  processPaymentOrder,
  verifyPaymentOrder
} = require('../controllers/paymentController');

router.route('/orders')
  .get(protect, getPaymentOrders)
  .post(protect, createPaymentOrder);

router.route('/orders/:orderId/process')
  .post(protect, processPaymentOrder);

router.route('/orders/:orderId/verify')
  .get(protect, verifyPaymentOrder);

module.exports = router;
