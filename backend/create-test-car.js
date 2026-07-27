const mongoose = require('mongoose');
const Car = require('./models/Car');

const uri = 'mongodb+srv://monimonasoccer003_db_user:iW1RKS0sBb1pEBY4@cluster0.r35wmgx.mongodb.net/car-rental-db?appName=Cluster0';

const testCar = {
  carName: 'Test Car Model Y (Unavailable)',
  brand: 'TestBrand',
  category: 'Sports Cars',
  fuelType: 'Electric',
  transmission: 'Automatic',
  seatingCapacity: 2,
  hourlyPrice: 10,
  dailyPrice: 100,
  totalUnits: 1,
  availableUnits: 0,
  images: [{ public_id: 'dummy_unavailable_car', url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }],
  features: ['GPS Navigation', 'Bluetooth'],
  description: 'This is a test car generated for verification purposes with an unavailable status.',
  status: 'Unavailable'
};

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB');
    await Car.create(testCar);
    console.log(`Created: ${testCar.carName}`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
