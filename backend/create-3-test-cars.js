const mongoose = require('mongoose');
const Car = require('./models/Car');

const uri = 'mongodb+srv://monimonasoccer003_db_user:iW1RKS0sBb1pEBY4@cluster0.r35wmgx.mongodb.net/car-rental-db?appName=Cluster0';

const cars = [
  {
    carName: 'Test Car A',
    brand: 'TestBrand',
    category: 'Sports Cars',
    fuelType: 'Electric',
    transmission: 'Automatic',
    seatingCapacity: 2,
    hourlyPrice: 15,
    dailyPrice: 150,
    totalUnits: 2,
    availableUnits: 2,
    images: [{ public_id: 'dummy_test_car_a', url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }],
    features: ['GPS Navigation', 'Bluetooth'],
    description: 'This is test car A.',
    status: 'Available'
  },
  {
    carName: 'Test Car B',
    brand: 'TestBrand',
    category: 'Luxury Sedans',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    seatingCapacity: 4,
    hourlyPrice: 20,
    dailyPrice: 200,
    totalUnits: 1,
    availableUnits: 1,
    images: [{ public_id: 'dummy_test_car_b', url: 'https://images.unsplash.com/photo-1503376710356-70e63715c26b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }],
    features: ['GPS Navigation', 'Bluetooth', 'Leather Seats'],
    description: 'This is test car B.',
    status: 'Available'
  },
  {
    carName: 'Test Car C',
    brand: 'TestBrand',
    category: 'Luxury SUVs',
    fuelType: 'Diesel',
    transmission: 'Automatic',
    seatingCapacity: 7,
    hourlyPrice: 25,
    dailyPrice: 250,
    totalUnits: 3,
    availableUnits: 3,
    images: [{ public_id: 'dummy_test_car_c', url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0b12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }],
    features: ['GPS Navigation', 'Bluetooth', 'Sunroof'],
    description: 'This is test car C.',
    status: 'Available'
  }
];

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB');
    for (const car of cars) {
      await Car.create(car);
      console.log(`Created: ${car.carName}`);
    }
    console.log('Successfully created 3 test cars');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
