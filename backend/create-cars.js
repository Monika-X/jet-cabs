const mongoose = require('mongoose');
const Car = require('./models/Car');

const uri = 'mongodb+srv://monimonasoccer003_db_user:iW1RKS0sBb1pEBY4@cluster0.r35wmgx.mongodb.net/car-rental-db?appName=Cluster0';

const cars = [
  {
    carName: 'BMW X5',
    brand: 'BMW',
    category: 'Luxury SUVs',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    seatingCapacity: 5,
    hourlyPrice: 35,
    dailyPrice: 280,
    totalUnits: 3,
    availableUnits: 3,
    images: [{ public_id: 'dummy_bmw_x5', url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }],
    features: ['GPS Navigation', 'Bluetooth', 'Leather Seats', 'Sunroof'],
    description: 'A powerful and luxurious SUV suitable for both city and off-road driving.',
    status: 'Available'
  },
  {
    carName: 'Mercedes-Benz S-Class',
    brand: 'Mercedes-Benz',
    category: 'Luxury Sedans',
    fuelType: 'Diesel',
    transmission: 'Automatic',
    seatingCapacity: 5,
    hourlyPrice: 50,
    dailyPrice: 400,
    totalUnits: 2,
    availableUnits: 2,
    images: [{ public_id: 'dummy_merc_sclass', url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }],
    features: ['GPS Navigation', 'Bluetooth', 'Leather Seats', 'Premium Audio'],
    description: 'The pinnacle of luxury sedans, offering unmatched comfort and advanced technology.',
    status: 'Available'
  },
  {
    carName: 'Porsche 911',
    brand: 'Porsche',
    category: 'Sports Cars',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    seatingCapacity: 2,
    hourlyPrice: 80,
    dailyPrice: 650,
    totalUnits: 1,
    availableUnits: 1,
    images: [{ public_id: 'dummy_porsche_911', url: 'https://images.unsplash.com/photo-1503376710356-70e63715c26b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }],
    features: ['Bluetooth', 'Leather Seats', 'Sport Suspension', 'Keyless Entry'],
    description: 'A legendary sports car with thrilling performance and timeless design.',
    status: 'Available'
  },
  {
    carName: 'Tesla Model S',
    brand: 'Tesla',
    category: 'Electric Vehicles',
    fuelType: 'Electric',
    transmission: 'Automatic',
    seatingCapacity: 5,
    hourlyPrice: 40,
    dailyPrice: 320,
    totalUnits: 4,
    availableUnits: 4,
    images: [{ public_id: 'dummy_tesla_s', url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }],
    features: ['GPS Navigation', 'Bluetooth', 'Autopilot', 'Heated Seats'],
    description: 'An all-electric luxury sedan with incredible range and futuristic technology.',
    status: 'Available'
  },
  {
    carName: 'Audi Q8',
    brand: 'Audi',
    category: 'Luxury SUVs',
    fuelType: 'Hybrid',
    transmission: 'Automatic',
    seatingCapacity: 5,
    hourlyPrice: 30,
    dailyPrice: 250,
    totalUnits: 2,
    availableUnits: 2,
    images: [{ public_id: 'dummy_audi_q8', url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0b12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }],
    features: ['GPS Navigation', 'Bluetooth', 'Leather Seats', 'Panoramic Roof'],
    description: 'A stylish and versatile luxury SUV with a comfortable ride.',
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
    console.log('Successfully created 5 cars');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
