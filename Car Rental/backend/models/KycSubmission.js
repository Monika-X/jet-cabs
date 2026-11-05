const mongoose = require('mongoose');

const kycSubmissionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    documentType: {
      type: String,
      enum: ['drivers_license', 'national_id', 'passport'],
      required: true
    },
    documentNumber: { type: String, required: true },
    idFrontName: { type: String, default: '' },
    idBackName: { type: String, default: '' },
    licenseFrontName: { type: String, default: '' },
    licenseBackName: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING'
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('KycSubmission', kycSubmissionSchema);
