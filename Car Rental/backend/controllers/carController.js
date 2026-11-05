const Car = require('../models/Car');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/uploadToCloudinary');

/**
 * @desc    Create a new car
 * @route   POST /api/cars
 * @access  Private/Admin
 */
const createCar = async (req, res, next) => {
  const images = [];
  try {
    const {
      carName, brand, category, fuelType, transmission,
      seatingCapacity, hourlyPrice, dailyPrice,
      totalUnits, availableUnits, features, description
    } = req.body;

    if (!req.files || req.files.length === 0) {
      res.status(400);
      return next(new Error('At least one car image is required.'));
    }

    if (req.files.length > 10) {
      res.status(400);
      return next(new Error('Maximum 10 images allowed per car.'));
    }

    // Upload images to Cloudinary
    try {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'car-rental/cars');
        images.push({
          public_id: result.public_id,
          url: result.secure_url
        });
      }
    } catch (uploadError) {
      // Rollback: delete any successfully uploaded images before failing
      for (const img of images) {
        await deleteFromCloudinary(img.public_id).catch(() => {}); // Ignore deletion errors during rollback
      }
      res.status(500);
      return next(new Error('Image upload failed. Please try again.'));
    }

    // Parse features if sent as JSON string from FormData
    let parsedFeatures = [];
    if (features) {
      try {
        parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
      } catch (e) {
        parsedFeatures = features.split(',').map(f => f.trim());
      }
    }

    const car = new Car({
      carName, brand, category, fuelType, transmission,
      seatingCapacity: Number(seatingCapacity),
      hourlyPrice: Number(hourlyPrice),
      dailyPrice: Number(dailyPrice),
      totalUnits: Number(totalUnits),
      availableUnits: Number(availableUnits),
      images,
      features: parsedFeatures,
      description
    });

    const createdCar = await car.save();
    res.status(201).json({ success: true, message: 'Car created successfully', data: createdCar });
  } catch (error) {
    // If saving to MongoDB fails, clean up the images uploaded to Cloudinary
    if (images && images.length > 0) {
      for (const img of images) {
        await deleteFromCloudinary(img.public_id).catch(() => {}); // Ignore errors
      }
    }
    next(error);
  }
};

/**
 * @desc    Update a car
 * @route   PUT /api/cars/:id
 * @access  Private/Admin
 */
const updateCar = async (req, res, next) => {
  let retainedPublicIds = [];
  let finalImages = [];
  try {
    const carId = req.params.id;
    const car = await Car.findById(carId);

    if (!car) {
      res.status(404);
      return next(new Error('Car not found'));
    }

    const {
      carName, brand, category, fuelType, transmission,
      seatingCapacity, hourlyPrice, dailyPrice,
      totalUnits, availableUnits, features, description,
      retainedImages // Array of public_ids from the existing images that the user wants to keep
    } = req.body;

    // Parse retained images
    if (retainedImages) {
      let raw = retainedImages;
      if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch (e) { raw = [raw]; }
      }
      if (!Array.isArray(raw)) raw = [raw];
      // Accept either public_id strings or full image objects { public_id, url }
      retainedPublicIds = raw.map(item =>
        typeof item === 'string' ? item : (item && item.public_id)
      ).filter(Boolean);
    }

    // Determine which old images to delete
    const imagesToDelete = car.images.filter(img => !retainedPublicIds.includes(img.public_id));
    finalImages = car.images.filter(img => retainedPublicIds.includes(img.public_id));

    const newFilesCount = req.files ? req.files.length : 0;
    const totalFutureImages = finalImages.length + newFilesCount;

    if (totalFutureImages === 0) {
      res.status(400);
      return next(new Error('At least one car image is required.'));
    }
    if (totalFutureImages > 10) {
      res.status(400);
      return next(new Error('Maximum 10 images allowed per car.'));
    }

    // Upload new images if provided
    try {
      if (newFilesCount > 0) {
        for (const file of req.files) {
          const result = await uploadToCloudinary(file.buffer, 'car-rental/cars');
          finalImages.push({
            public_id: result.public_id,
            url: result.secure_url
          });
        }
      }
    } catch (uploadError) {
      // Rollback newly uploaded images that succeeded before the error
      const newlyUploaded = finalImages.filter(img => !retainedPublicIds.includes(img.public_id));
      for (const img of newlyUploaded) {
        await deleteFromCloudinary(img.public_id).catch(() => {});
      }
      res.status(500);
      return next(new Error('Image upload failed. Please try again.'));
    }

    // Now it is safe to delete removed images from Cloudinary
    for (const img of imagesToDelete) {
      await deleteFromCloudinary(img.public_id).catch(err => console.error('Failed to delete old image:', err));
    }

    // Parse features
    let parsedFeatures = car.features;
    if (features) {
      try {
        parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
      } catch (e) {
        parsedFeatures = features.split(',').map(f => f.trim());
      }
    }

    // Update fields
    if (carName) car.carName = carName;
    if (brand) car.brand = brand;
    if (category) car.category = category;
    if (fuelType) car.fuelType = fuelType;
    if (transmission) car.transmission = transmission;
    if (seatingCapacity !== undefined) car.seatingCapacity = Number(seatingCapacity);
    if (hourlyPrice !== undefined) car.hourlyPrice = Number(hourlyPrice);
    if (dailyPrice !== undefined) car.dailyPrice = Number(dailyPrice);
    if (totalUnits !== undefined) car.totalUnits = Number(totalUnits);
    if (availableUnits !== undefined) car.availableUnits = Number(availableUnits);
    if (description) car.description = description;
    car.features = parsedFeatures;
    car.images = finalImages;

    const updatedCar = await car.save();
    res.status(200).json({ success: true, message: 'Car updated successfully', data: updatedCar });
  } catch (error) {
    // If saving to MongoDB fails, rollback any NEWLY uploaded images
    const newFilesCount = req.files ? req.files.length : 0;
    if (newFilesCount > 0 && finalImages && retainedPublicIds) {
      const newlyUploaded = finalImages.filter(img => !retainedPublicIds.includes(img.public_id));
      for (const img of newlyUploaded) {
        await deleteFromCloudinary(img.public_id).catch(() => {});
      }
    }
    next(error);
  }
};

/**
 * @desc    Delete a car
 * @route   DELETE /api/cars/:id
 * @access  Private/Admin
 */
const deleteCar = async (req, res, next) => {
  try {
    const carId = req.params.id;
    const car = await Car.findById(carId);

    if (!car) {
      res.status(404);
      return next(new Error('Car not found'));
    }

    // Delete all images from Cloudinary (ignore errors to ensure DB record is deleted)
    for (const img of car.images) {
      await deleteFromCloudinary(img.public_id).catch(err => console.error('Failed to delete image on car delete:', err));
    }

    await car.deleteOne();
    res.status(200).json({ success: true, message: 'Car deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all cars (Search, Filter, Sort, Paginate)
 * @route   GET /api/cars
 * @access  Public (Customers only see 'Available', Admins see all)
 */
const getCars = async (req, res, next) => {
  try {
    const {
      search, brand, category, fuelType, transmission,
      minPrice, maxPrice, seatingCapacity, sort, page = 1, limit = 10
    } = req.query;

    const query = {};

    // Filter out unavailable cars for public requests
    if (!req.user || req.user.role !== 'admin') {
      query.status = 'Available';
    }

    if (search) {
      query.$or = [
        { carName: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    if (brand) {
      const brands = brand.split(',').map(b => new RegExp(b.trim(), 'i'));
      query.brand = { $in: brands };
    }
    if (category) {
      const categories = category.split(',').map(c => new RegExp(c.trim(), 'i'));
      query.category = { $in: categories };
    }
    if (fuelType) {
      const fuels = fuelType.split(',').map(f => new RegExp(f.trim(), 'i'));
      query.fuelType = { $in: fuels };
    }
    if (transmission) {
      const trans = transmission.split(',').map(t => new RegExp(t.trim(), 'i'));
      query.transmission = { $in: trans };
    }
    if (seatingCapacity) {
      const seats = seatingCapacity.split(',').map(s => Number(s.trim())).filter(s => !isNaN(s));
      if (seats.length > 0) query.seatingCapacity = { $in: seats };
    }

    if (minPrice || maxPrice) {
      const min = Number(minPrice);
      const max = Number(maxPrice);
      if ((minPrice && isNaN(min)) || (maxPrice && isNaN(max))) {
        res.status(400);
        return next(new Error('minPrice and maxPrice must be valid numbers.'));
      }
      query.dailyPrice = {};
      if (minPrice) query.dailyPrice.$gte = min;
      if (maxPrice) query.dailyPrice.$lte = max;
    }

    let sortOptions = { createdAt: -1 }; // default Newest
    if (sort === 'priceLowToHigh') sortOptions = { dailyPrice: 1 };
    if (sort === 'priceHighToLow') sortOptions = { dailyPrice: -1 };
    if (sort === 'oldest') sortOptions = { createdAt: 1 };
    if (sort === 'alphabetical') sortOptions = { carName: 1 };

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Car.countDocuments(query);
    const cars = await Car.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      message: 'Cars fetched successfully',
      data: cars,
      pagination: {
        totalRecords: total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single car
 * @route   GET /api/cars/:id
 * @access  Public
 */
const getCarById = async (req, res, next) => {
  try {
    const carId = req.params.id;
    const car = await Car.findById(carId);

    if (!car) {
      res.status(404);
      return next(new Error('Car not found'));
    }

    // Optional: Hide unavailable car from customers if they guess the ID
    if (car.status !== 'Available' && (!req.user || req.user.role !== 'admin')) {
       res.status(404);
       return next(new Error('Car not found'));
    }

    res.status(200).json({ success: true, message: 'Car fetched successfully', data: car });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregated counts for all filter categories
 * @route   GET /api/cars/filters
 * @access  Public
 */
const getFilterCounts = async (req, res, next) => {
  try {
    const match = { status: 'Available' };
    
    const [categories, brands, fuelTypes, transmissions, seating] = await Promise.all([
      Car.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
      Car.aggregate([{ $match: match }, { $group: { _id: '$brand', count: { $sum: 1 } } }]),
      Car.aggregate([{ $match: match }, { $group: { _id: '$fuelType', count: { $sum: 1 } } }]),
      Car.aggregate([{ $match: match }, { $group: { _id: '$transmission', count: { $sum: 1 } } }]),
      Car.aggregate([{ $match: match }, { $group: { _id: '$seatingCapacity', count: { $sum: 1 } } }])
    ]);

    res.status(200).json({
      success: true,
      data: {
        categories,
        brands,
        fuelTypes,
        transmissions,
        seating
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get alternative car recommendations for an unavailable vehicle
 * @route   GET /api/cars/:id/alternatives
 * @access  Public
 * Priority: 1) Same rental price  2) Closest rental price
 *           3) Same category      4) Same seating capacity
 */
const getCarAlternatives = async (req, res, next) => {
  try {
    const carId = req.params.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 10);

    const requestedCar = await Car.findById(carId);
    if (!requestedCar) {
      res.status(404);
      return next(new Error('Car not found'));
    }

    // Never recommend the requested vehicle or vehicles without stock
    const candidates = await Car.find({
      _id: { $ne: carId },
      status: 'Available',
      availableUnits: { $gt: 0 }
    });

    const targetPrice = requestedCar.dailyPrice || 0;
    const targetCategory = requestedCar.category || '';
    const targetSeats = requestedCar.seatingCapacity || 0;

    const ranked = candidates
      .map(car => ({
        car,
        priceDiff: Math.abs((car.dailyPrice || 0) - targetPrice),
        sameCategory: car.category === targetCategory,
        sameSeats: car.seatingCapacity === targetSeats
      }))
      .sort((a, b) => {
        if (a.priceDiff !== b.priceDiff) return a.priceDiff - b.priceDiff;
        if (a.sameCategory !== b.sameCategory) return a.sameCategory ? -1 : 1;
        if (a.sameSeats !== b.sameSeats) return a.sameSeats ? -1 : 1;
        return 0;
      })
      .slice(0, limit);

    const data = ranked.map(({ car, priceDiff, sameCategory, sameSeats }) => ({
      _id: car._id,
      carName: car.carName,
      brand: car.brand,
      category: car.category,
      fuelType: car.fuelType,
      transmission: car.transmission,
      seatingCapacity: car.seatingCapacity,
      hourlyPrice: car.hourlyPrice,
      dailyPrice: car.dailyPrice,
      images: car.images,
      features: car.features,
      description: car.description,
      availableUnits: car.availableUnits,
      match: {
        priceDiff,
        sameCategory,
        sameSeats
      }
    }));

    res.status(200).json({
      success: true,
      message: data.length > 0 ? 'Alternative vehicles found' : 'No alternative vehicles available',
      data,
      requestedCar: {
        _id: requestedCar._id,
        carName: requestedCar.carName,
        brand: requestedCar.brand,
        dailyPrice: requestedCar.dailyPrice
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCar,
  updateCar,
  deleteCar,
  getCars,
  getCarById,
  getFilterCounts,
  getCarAlternatives
};
