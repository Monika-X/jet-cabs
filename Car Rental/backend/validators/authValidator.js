const validateRegister = (req, res, next) => {
  const { fullName, email, phone, password, confirmPassword } = req.body;
  if (!fullName || !email || !phone || !password || !confirmPassword) {
    res.status(400);
    return next(new Error('Please fill all required fields'));
  }

  // Email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    return next(new Error('Please enter a valid email address'));
  }

  if (password !== confirmPassword) {
    res.status(400);
    return next(new Error('Passwords do not match'));
  }

  // Strong password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(password)) {
    res.status(400);
    return next(new Error('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'));
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    return next(new Error('Please provide email and password'));
  }
  next();
};

const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    res.status(400);
    return next(new Error('Please provide a valid email address'));
  }
  next();
};

const validateResetPassword = (req, res, next) => {
  const { token, password, confirmPassword } = req.body;
  if (!token) {
    res.status(400);
    return next(new Error('Reset token is required'));
  }
  if (!password || !confirmPassword) {
    res.status(400);
    return next(new Error('Please fill all required fields'));
  }
  if (password !== confirmPassword) {
    res.status(400);
    return next(new Error('Passwords do not match'));
  }
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(password)) {
    res.status(400);
    return next(new Error('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'));
  }
  next();
};

module.exports = { validateRegister, validateLogin, validateForgotPassword, validateResetPassword };
