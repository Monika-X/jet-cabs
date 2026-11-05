require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');
const connectCloudinary = require('./config/cloudinary');
const { startReminderScheduler } = require('./services/reminderScheduler');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
  // Start the notification/reminder scheduler once the DB is available
  startReminderScheduler();
});

// Configure Cloudinary
connectCloudinary();

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  const { stopReminderScheduler } = require('./services/reminderScheduler');
  stopReminderScheduler();
  server.close(() => {
    mongoose.disconnect().then(() => {
      console.log('Database connection closed.');
      process.exit(0);
    });
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
