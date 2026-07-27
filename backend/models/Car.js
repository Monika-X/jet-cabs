const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    carName: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    fuelType: { type: String, required: true },
    transmission: { type: String, required: true },
    seatingCapacity: { 
      type: Number, 
      required: true,
      min: [1, 'Seating capacity must be at least 1']
    },
    hourlyPrice: { 
      type: Number, 
      required: true,
      min: [0, 'Hourly price cannot be negative']
    },
    dailyPrice: { 
      type: Number, 
      required: true,
      min: [0, 'Daily price cannot be negative']
    },
    totalUnits: { 
      type: Number, 
      required: true,
      min: [1, 'Total units must be greater than 0']
    },
    availableUnits: { 
      type: Number, 
      required: true,
      min: [0, 'Available units cannot be negative']
    },
    images: {
      type: [
        {
          public_id: { type: String, required: true },
          url: { type: String, required: true }
        }
      ],
      validate: [
        (val) => val.length >= 1 && val.length <= 10,
        'A car must have between 1 and 10 images.'
      ]
    },
    features: { type: [String], default: [] },
    description: { type: String, trim: true },
    status: { 
      type: String, 
      enum: ['Available', 'Unavailable'],
      default: 'Available'
    }
  },
  { timestamps: true }
);

// Pre-save hook for Inventory Consistency
carSchema.pre('save', function () {
  if (this.availableUnits > this.totalUnits) {
    this.availableUnits = this.totalUnits;
  }
  this.status = this.availableUnits > 0 ? 'Available' : 'Unavailable';
});


module.exports = mongoose.model('Car', carSchema);
