const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Auth admin & get token (Optional if authController.loginUser is used for both, but required by instructions for separation)
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, role: 'admin' });

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          _id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role
        },
        token: generateToken(admin._id, admin.role),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password, or not an admin');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private/Admin
const getAdminProfile = async (req, res, next) => {
  try {
    const admin = await User.findById(req.user._id).select('-password');
    if (admin && admin.role === 'admin') {
      res.json({
        success: true,
        message: 'Admin profile retrieved successfully',
        data: admin
      });
    } else {
      res.status(404);
      throw new Error('Admin not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  getAdminProfile
};
