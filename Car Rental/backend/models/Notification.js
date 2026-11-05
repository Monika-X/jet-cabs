const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: [
        'booking_confirmed',
        'rental_started',
        'rental_expires_1h',
        'rental_expires_30m',
        'rental_expires_15m',
        'rental_extended',
        'extension_requested',
        'extension_rejected',
        'return_vehicle_reminder',
        'rental_completed',
        'prebooking_approved',
        'prebooking_rejected',
        'booking_cancelled',
        'alternative_suggested',
        'vehicle_assigned'
      ],
      required: true,
      index: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    expiresAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Partial unique index: each reminder interval can only exist once per booking.
// Event notifications (confirmed/started/extended/completed) may occur repeatedly.
notificationSchema.index(
  { booking: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: { $in: ['rental_expires_1h', 'rental_expires_30m', 'rental_expires_15m'] }
    }
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
