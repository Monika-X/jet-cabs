const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car',
      required: true
    },
    bookingType: {
      type: String,
      enum: ['PRE_BOOKING', 'DIRECT_BOOKING'],
      required: true
    },
    bookingStatus: {
      type: String,
      enum: ['Pending Pickup', 'Active', 'Extended', 'Completed', 'Cancelled'],
      default: 'Pending Pickup'
    },
    rentalDetails: {
      rentalType: { type: String, enum: ['hourly', 'daily'], required: true },
      pickupDateTime: { type: Date, required: true },
      returnDateTime: { type: Date, required: true },
      pickupLocation: { type: String, required: true },
      returnLocation: { type: String, required: true },
      rentalPurpose: { type: String },
      specialRequests: { type: String }
    },
    customerDetails: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      preferredContactMethod: { type: String },
      dob: { type: String },
      nationality: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      postal: { type: String },
      license: { type: String },
      licenseCountry: { type: String },
      licenseExpiry: { type: String }
    },
    estimatedPricing: {
      baseCharge: { type: Number, required: true },
      taxes: { type: Number, required: true },
      estimatedTotal: { type: Number, required: true }
    },
    rentalStartTime: {
      type: Date
    },
    rentalEndTime: {
      type: Date
    },
    extensionHistory: [
      {
        additionalHours: { type: Number, required: true },
        additionalAmount: { type: Number, required: true },
        extendedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
        approvedAt: { type: Date },
        rejectedAt: { type: Date },
        rejectionReason: { type: String }
      }
    ],
    preBookingStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Alternative Suggested', 'Alternative Accepted', 'Alternative Declined', 'Expired'],
      default: 'Pending'
    },
    suggestedAlternative: {
      car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
      message: { type: String },
      suggestedAt: { type: Date }
    },
    inventoryRestored: {
      type: Boolean,
      default: false
    },
    totalAmount: {
      type: Number
    },
    paymentStatus: {
      type: String,
      default: 'Pending'
    },
    pickupPhoto: {
      public_id: { type: String },
      url: { type: String }
    },
    returnPhoto: {
      public_id: { type: String },
      url: { type: String }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
