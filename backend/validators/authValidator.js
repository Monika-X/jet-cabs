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

module.exports = { validateRegister, validateLogin };
