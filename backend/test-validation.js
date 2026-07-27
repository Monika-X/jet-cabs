const mongoose = require('mongoose');
const Car = require('./models/Car');

const uri = 'mongodb+srv://monimonasoccer003_db_user:iW1RKS0sBb1pEBY4@cluster0.r35wmgx.mongodb.net/car-rental-db?appName=Cluster0';

mongoose.connect(uri)
  .then(async () => {
    try {
      const car = new Car({
        carName: 'Validation Test Car',
        brand: 'Test',
        category: 'Sports',
        fuelType: 'Electric',
        transmission: 'Automatic',
        seatingCapacity: Number(""), // This equates to 0
        hourlyPrice: Number(""),     // Equates to 0
        dailyPrice: Number(""),      // Equates to 0
        totalUnits: Number(""),      // Equates to 0
        availableUnits: Number(""),  // Equates to 0
        images: [{ public_id: 'test_id', url: 'test_url' }],
        features: []
      });
      await car.validate();
      console.log("Validation passed unexpectedly!");
    } catch (err) {
      console.error("Validation failed as expected:", err.message);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
