require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Car = require('./models/Car');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Realistic Data Maps
const BRAND_MODELS = {
  audi: ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'e-tron', 'R8'],
  bmw: ['3 Series', '5 Series', 'X3', 'X5', 'X7', 'M4', 'i4'],
  ford: ['Mustang', 'Explorer', 'F-150', 'Escape', 'Bronco', 'Edge'],
  honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V'],
  hyundai: ['Tucson', 'Santa Fe', 'Elantra', 'Sonata', 'Ioniq 5', 'Palisade'],
  mercedes: ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'G-Class'],
  porsche: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan', '718 Cayman'],
  'range-rover': ['Evoque', 'Velar', 'Sport', 'Defender', 'Discovery'],
  tesla: ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck'],
  toyota: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Prius']
};

const CATEGORIES = ['Sedans', 'SUVs', 'Hatchbacks', 'Convertibles', 'Luxury', 'Electric'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const TRANSMISSIONS = ['Automatic', 'Manual'];
const FEATURES_LIST = ['GPS Navigation', 'Bluetooth', 'Leather Seats', 'Sunroof', 'Backup Camera', 'Adaptive Cruise Control', 'Apple CarPlay', 'Android Auto', 'Heated Seats', 'Premium Audio'];

// Helper for random items
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFeatures = () => {
  const count = getRandomInt(3, 7);
  const shuffled = [...FEATURES_LIST].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const seedDatabase = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected.');

  const baseDir = path.join(__dirname, 'seed-images');
  
  if (!fs.existsSync(baseDir)) {
    console.log('Seed images directory not found. Please create it and add images.');
    process.exit(1);
  }

  const brands = fs.readdirSync(baseDir);
  
  let totalProcessed = 0;
  let totalUploaded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const brand of brands) {
    const brandPath = path.join(baseDir, brand);
    
    // Skip if not a directory
    if (!fs.statSync(brandPath).isDirectory()) continue;
    
    const files = fs.readdirSync(brandPath).filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i));
    
    if (files.length === 0) {
      console.log(`No images found for brand: ${brand}`);
      continue;
    }

    console.log(`Processing ${files.length} images for ${brand}...`);

    for (const file of files) {
      totalProcessed++;
      const filePath = path.join(brandPath, file);
      const filenameWithoutExt = path.parse(file).name.replace(/[^a-zA-Z0-9]/g, '_');
      
      // We explicitly set a predictable public ID to allow skipping duplicates
      const publicId = `car-rental/seed/${brand}_${filenameWithoutExt}`;
      let secureUrl = '';

      try {
        // 1. Check if it already exists in Cloudinary
        try {
          const existing = await cloudinary.api.resource(publicId);
          secureUrl = existing.secure_url;
          console.log(`  [SKIPPED] Image ${file} already uploaded.`);
          totalSkipped++;
        } catch (err) {
          // 404 means it doesn't exist, so we proceed to upload
          if (err.error && err.error.http_code === 404) {
            console.log(`  [UPLOADING] Uploading ${file} to Cloudinary...`);
            const uploadResult = await cloudinary.uploader.upload(filePath, {
              public_id: publicId,
              overwrite: true
            });
            secureUrl = uploadResult.secure_url;
            totalUploaded++;
          } else {
            throw err; // Real error
          }
        }

        // 1b. Skip if a car document already exists for this image (prevents duplicate cars on re-run)
        const existingCar = await Car.findOne({ 'images.public_id': publicId });
        if (existingCar) {
          console.log(`  [SKIPPED] Car for image ${file} already exists (${existingCar.carName}).`);
          totalSkipped++;
          continue;
        }

        // 2. Generate Realistic Specs
        const modelList = BRAND_MODELS[brand] || ['Sedan'];
        const carName = getRandom(modelList);
        const formatBrand = brand === 'range-rover' ? 'Range Rover' : brand.charAt(0).toUpperCase() + brand.slice(1);
        const fuel = carName.includes('i4') || carName.includes('e-tron') || carName.includes('Taycan') || brand === 'tesla' ? 'Electric' : getRandom(FUEL_TYPES);
        let category = getRandom(CATEGORIES);
        if (fuel === 'Electric') category = 'Electric';
        if (carName.includes('Q') || carName.includes('X') || carName === 'Macan' || carName === 'Cayenne' || carName === 'Explorer' || carName === 'Bronco' || carName.includes('CR-V') || carName.includes('Pilot')) category = 'SUVs';

        const units = getRandomInt(3, 10);
        
        const carData = {
          carName: `${formatBrand} ${carName}`,
          brand: formatBrand,
          category,
          fuelType: fuel,
          transmission: fuel === 'Electric' ? 'Automatic' : getRandom(TRANSMISSIONS),
          seatingCapacity: getRandomInt(2, 7),
          hourlyPrice: getRandomInt(15, 60),
          dailyPrice: getRandomInt(100, 400),
          totalUnits: units,
          availableUnits: units,
          images: [{ public_id: publicId, url: secureUrl }], // ONLY CLOUDINARY URL
          features: getRandomFeatures(),
          description: `Experience the thrill of driving the ${formatBrand} ${carName}. This vehicle is meticulously maintained and offers premium comfort and performance.`,
          status: 'Available'
        };

        // 3. Save to MongoDB
        const newCar = new Car(carData);
        await newCar.save();
        console.log(`  [SAVED] Created car document for ${carData.carName}`);

      } catch (error) {
        console.error(`  [FAILED] Error processing ${file}:`, error.message);
        totalFailed++;
      }
    }
  }

  console.log('\n--- Seeding Complete ---');
  console.log(`Total Processed: ${totalProcessed}`);
  console.log(`Total Uploaded:  ${totalUploaded}`);
  console.log(`Total Skipped:   ${totalSkipped}`);
  console.log(`Total Failed:    ${totalFailed}`);
  
  process.exit(0);
};

seedDatabase();
