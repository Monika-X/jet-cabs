const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');

// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // Check if user exists (only add phone to the query when provided so an
    // empty phone cannot false-positive against users without a phone)
    const userExists = await User.findOne(phone ? { $or: [{ email }, { phone }] } : { email });
    if (userExists) {
      res.status(400);
      throw new Error('User with this email or phone already exists');
    }

    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      role: 'customer'
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        },
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token (Handles both Customer and Admin as per recommendation)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (user.isSuspended) {
        res.status(403);
        throw new Error('Your account has been suspended. Please contact support.');
      }
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        },
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: user
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request a password reset link (token-based, 15 min expiry)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Always respond the same to avoid leaking which emails are registered
      return res.status(200).json({
        success: true,
        message: 'If an account exists for this email, a reset link has been sent.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const response = {
      success: true,
      message: 'If an account exists for this email, a reset link has been sent.'
    };
    if (process.env.NODE_ENV !== 'production') {
      response.data = { resetToken }; // Dev convenience: no email provider wired up yet
    }
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using a valid reset token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error('Reset token is invalid or has expired');
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update logged-in user profile (name, phone, avatar)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, profileImage } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (fullName !== undefined) {
      const name = String(fullName).trim();
      if (name.length < 2) {
        res.status(422);
        return next(new Error('Full name must be at least 2 characters.'));
      }
      user.fullName = name;
    }
    if (phone !== undefined && String(phone).trim() !== '') {
      const newPhone = String(phone).trim();
      const existing = await User.findOne({ phone: newPhone, _id: { $ne: user._id } });
      if (existing) {
        res.status(409);
        return next(new Error('Phone number is already in use.'));
      }
      user.phone = newPhone;
    }
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateProfile,
  logoutUser,
  forgotPassword,
  resetPassword
};
