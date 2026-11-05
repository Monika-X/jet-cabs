const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getCustomerDashboard } = require('../controllers/customerDashboardController');

router.get('/', protect, authorize('customer'), getCustomerDashboard);

module.exports = router;
