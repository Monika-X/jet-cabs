const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createPaymentOrder,
  processPaymentOrder,
  verifyPaymentOrder
} = require('../controllers/paymentController');

router.post('/orders', protect, createPaymentOrder);

router.route('/orders/:orderId/process')
  .post(protect, processPaymentOrder);

router.route('/orders/:orderId/verify')
  .get(protect, verifyPaymentOrder);

module.exports = router;
