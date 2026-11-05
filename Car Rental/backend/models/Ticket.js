const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: ['Support', 'Feedback'],
      default: 'Support'
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    status: {
      type: String,
      enum: ['Open', 'Resolved'],
      default: 'Open'
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  { timestamps: true }
);

ticketSchema.index({ customer: 1, createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
