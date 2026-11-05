const cron = require('node-cron');
const Booking = require('../models/Booking');
const { createReminder, clearReminders, TYPES } = require('./notificationService');

const ONE_HOUR_MS = 60 * 60 * 1000;
const THIRTY_MIN_MS = 30 * 60 * 1000;
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

const REMINDER_JOBS = [
  {
    type: TYPES.RENTAL_EXPIRES_1H,
    title: 'Rental Expires Soon',
    thresholdMs: ONE_HOUR_MS,
    nextThresholdMs: THIRTY_MIN_MS,
    buildMessage: (carName) => `Your rental for ${carName} expires in 1 hour.`
  },
  {
    type: TYPES.RENTAL_EXPIRES_30M,
    title: 'Rental Expires Soon',
    thresholdMs: THIRTY_MIN_MS,
    nextThresholdMs: FIFTEEN_MIN_MS,
    buildMessage: (carName) => `Your rental for ${carName} expires in 30 minutes.`
  },
  {
    type: TYPES.RENTAL_EXPIRES_15M,
    title: 'Rental Expires Soon',
    thresholdMs: FIFTEEN_MIN_MS,
    nextThresholdMs: 0,
    buildMessage: (carName) => `Your rental for ${carName} expires in 15 minutes.`
  }
];

const getCarName = (car) => {
  if (!car) return 'the vehicle';
  const brand = car.brand || '';
  const rawName = car.carName || '';
  const model = rawName.startsWith(brand) ? rawName.slice(brand.length).trim() : rawName;
  return `${brand} ${model}`.replace(/\s+/g, ' ').trim() || 'the vehicle';
};

/**
 * Evaluate one booking and create any reminder notifications that are due.
 * Each interval fires only within its exclusive time window, and creation is
 * upsert-based, so a booking can never receive a duplicate reminder.
 */
const evaluateBooking = async (booking) => {
  const returnTime = booking.rentalDetails && booking.rentalDetails.returnDateTime
    ? new Date(booking.rentalDetails.returnDateTime)
    : null;
  if (!returnTime) return;

  const now = Date.now();
  const remaining = returnTime.getTime() - now;

  // Overdue or no time left: no reminders to generate.
  if (remaining <= 0) return;

  for (const job of REMINDER_JOBS) {
    const inWindow = remaining <= job.thresholdMs && remaining > job.nextThresholdMs;
    if (!inWindow) continue;

    await createReminder({
      customer: booking.customer,
      booking: booking._id,
      title: job.title,
      message: job.buildMessage(getCarName(booking.car)),
      type: job.type
    });
    break; // Only one interval is possible per evaluation window
  }
};

/**
 * Scheduled job: checks all Active and Extended rentals every minute and
 * generates due reminder notifications.
 */
const runReminderCheck = async () => {
  try {
    const bookings = await Booking.find({
      bookingStatus: { $in: ['Active', 'Extended'] }
    }).populate('car');

    for (const booking of bookings) {
      await evaluateBooking(booking);
    }
  } catch (error) {
    console.error('Reminder scheduler check failed:', error.message);
  }
};

/**
 * Start the scheduler. Should only be called once the MongoDB connection is
 * established. Safely idempotent.
 */
let task = null;
const startReminderScheduler = () => {
  if (task) return task;

  task = cron.schedule(
    process.env.REMINDER_SCHEDULE || '* * * * *', // every minute by default
    () => {
      runReminderCheck().catch((err) => console.error('Scheduled reminder run failed:', err.message));
    }
  );
  task.start();
  console.log('[Scheduler] Reminder scheduler started (every minute).');
  return task;
};

const stopReminderScheduler = () => {
  if (task) {
    task.stop();
    task = null;
    console.log('[Scheduler] Reminder scheduler stopped.');
  }
};

module.exports = { startReminderScheduler, stopReminderScheduler, runReminderCheck, clearReminders };
