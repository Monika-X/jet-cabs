const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  getAdminProfile
} = require('../controllers/adminAuthController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateLogin } = require('../validators/authValidator');

router.post('/login', validateLogin, loginAdmin);
router.get('/profile', protect, authorize('admin'), getAdminProfile);

module.exports = router;
