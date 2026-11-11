const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// Global Middlewares
app.use(express.json());
app.use(cors());
// Relax helmet to allow static HTML execution properly
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  referrerPolicy: false
}));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health Check API
app.get('/api/health', (req, res) => {
  let dbState = 'Disconnected';
  switch (mongoose.connection.readyState) {
    case 0: dbState = 'Disconnected'; break;
    case 1: dbState = 'Connected'; break;
    case 2: dbState = 'Connecting'; break;
    case 3: dbState = 'Disconnecting'; break;
    default: dbState = 'Unknown';
  }

  res.status(200).json({
    success: true,
    message: 'Backend running successfully',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbState
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/cars', require('./routes/carRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/kyc', require('./routes/kycRoutes'));

// Serve Frontend Static Files.
// Only public assets and HTML pages are served — backend sources (scripts, seeds,
// .env) must never be reachable over HTTP.
app.use('/assets', express.static(path.join(__dirname, '../assets'), { maxAge: '7d' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), { maxAge: '7d' }));
app.use((req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  const publicExts = ['.html', '.txt', '.xml', '.webmanifest', '.ico'];
  if (req.path === '/' || publicExts.includes(ext)) return next();
  return res.status(404).json({ success: false, message: 'Not Found' });
});
app.use(express.static(path.join(__dirname, '../')));

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
