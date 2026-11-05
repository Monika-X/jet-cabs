const Notification = require('../models/Notification');

const TYPES = {
  BOOKING_CONFIRMED: 'booking_confirmed',
  RENTAL_STARTED: 'rental_started',
  RENTAL_EXPIRES_1H: 'rental_expires_1h',
  RENTAL_EXPIRES_30M: 'rental_expires_30m',
  RENTAL_EXPIRES_15M: 'rental_expires_15m',
  RENTAL_EXTENDED: 'rental_extended',
  EXTENSION_REQUESTED: 'extension_requested',
  EXTENSION_REJECTED: 'extension_rejected',
  RETURN_VEHICLE_REMINDER: 'return_vehicle_reminder',
  RENTAL_COMPLETED: 'rental_completed',
  PREBOOKING_APPROVED: 'prebooking_approved',
  PREBOOKING_REJECTED: 'prebooking_rejected',
  BOOKING_CANCELLED: 'booking_cancelled',
  ALTERNATIVE_SUGGESTED: 'alternative_suggested',
  VEHICLE_ASSIGNED: 'vehicle_assigned'
};

const REMINDER_TYPES = [
  TYPES.RENTAL_EXPIRES_1H,
  TYPES.RENTAL_EXPIRES_30M,
  TYPES.RENTAL_EXPIRES_15M
];

/**
 * Create a one-off event notification (booking confirmed, rental started, etc.).
 * Never throws: booking flows must not fail because of notification issues.
 */
const createNotification = async ({ customer, booking, title, message, type, expiresAt = null }) => {
  try {
    const notification = new Notification({
      customer,
      booking,
      title,
      message,
      type,
      isRead: false,
      expiresAt: expiresAt || undefined
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error(`Notification create failed (type=${type}, booking=${booking}):`, error.message);
    return null;
  }
};

/**
 * Create a reminder notification exactly once per booking per interval.
 * Uses an upsert against the partial unique index on (booking, reminderType),
 * so duplicate reminders can never be created even if the scheduler fires twice.
 */
const createReminder = async ({ customer, booking, title, message, type }) => {
  try {
    const filter = { booking, type };
    const update = {
      $setOnInsert: {
        customer,
        booking,
        title,
        message,
        type,
        isRead: false
      }
    };
    const result = await Notification.findOneAndUpdate(filter, update, {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true
    });
    return result;
  } catch (error) {
    console.error(`Reminder create failed (type=${type}, booking=${booking}):`, error.message);
    return null;
  }
};

/**
 * Delete all pending reminder notifications for a booking.
 * Called when a rental is completed, cancelled or extended (so timings can be
 * recalculated against the new return time).
 */
const clearReminders = async (bookingId) => {
  try {
    await Notification.deleteMany({
      booking: bookingId,
      type: { $in: REMINDER_TYPES }
    });
  } catch (error) {
    console.error(`clearReminders failed (booking=${bookingId}):`, error.message);
  }
};

module.exports = { createNotification, createReminder, clearReminders, TYPES, REMINDER_TYPES };
