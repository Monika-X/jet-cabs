require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');

const CATEGORY_MAP = {
  'Electric Vehicles': 'Electric',
  'Luxury Sedans': 'Luxury',
  'Luxury SUVs': 'SUVs',
  'Sports Cars': 'Sports',
  'Economy Cars': 'Sedans',
  'SUV': 'SUVs',
  'Sedan': 'Sedans',
  'Convertible': 'Convertibles',
  'Hatchback': 'Hatchbacks'
};

const BRAND_FIX = {
  'Bmw': 'BMW'
};

const normalizeCars = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected.');

  const cars = await Car.find({});
  console.log(`Total cars: ${cars.length}`);

  let categoryFixed = 0;
  let nameFixed = 0;
  let brandFixed = 0;

  for (const car of cars) {
    let changed = false;

    if (CATEGORY_MAP[car.category]) {
      car.category = CATEGORY_MAP[car.category];
      changed = true;
      categoryFixed++;
    }

    if (BRAND_FIX[car.brand]) {
      car.brand = BRAND_FIX[car.brand];
      changed = true;
      brandFixed++;
    }

    const prefix = `${car.brand} `;
    if (car.carName && car.carName.startsWith(prefix + car.brand)) {
      car.carName = car.carName.replace(new RegExp(`^${prefix}${car.brand} `), `${prefix}`);
      changed = true;
      nameFixed++;
    }

    if (changed) {
      await car.save();
    }
  }

  console.log(`\n--- Normalization Complete ---`);
  console.log(`Categories fixed:  ${categoryFixed}`);
  console.log(`Brands fixed:      ${brandFixed}`);
  console.log(`Car names fixed:   ${nameFixed}`);
  process.exit(0);
};

normalizeCars().catch((err) => {
  console.error(err);
  process.exit(1);
});
