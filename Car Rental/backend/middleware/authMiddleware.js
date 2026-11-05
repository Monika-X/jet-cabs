const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }
      if (req.user.isSuspended) {
        res.status(403);
        throw new Error('Your account has been suspended. Please contact support.');
      }
      next();
    } catch (error) {
      // Preserve explicit status codes (e.g. 403 for suspended accounts) instead
      // of overwriting everything with a generic 401.
      if (res.statusCode === 200) res.status(401);
      next(error);
    }
  } else {
    res.status(401);
    next(new Error('Not authorized, no token'));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`User role '${req.user ? req.user.role : 'unknown'}' is not authorized to access this route`));
    }
    next();
  };
};

const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Ignore errors, req.user remains undefined
    }
  }
  next();
};

module.exports = { protect, authorize, optionalProtect };
