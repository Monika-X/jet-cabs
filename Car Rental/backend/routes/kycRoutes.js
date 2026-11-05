const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { submitKyc, getMyKycStatus } = require('../controllers/kycController');

router.route('/')
  .post(protect, submitKyc);

router.route('/mine')
  .get(protect, getMyKycStatus);

module.exports = router;
