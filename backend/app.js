const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// Global Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
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

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
