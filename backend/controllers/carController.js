const Car = require('../models/Car');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/uploadToCloudinary');

/**
 * @desc    Create a new car
 * @route   POST /api/cars
 * @access  Private/Admin
 */
const createCar = async (req, res, next) => {
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
    const images = [];
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
    let retainedPublicIds = [];
    if (retainedImages) {
      try {
        retainedPublicIds = typeof retainedImages === 'string' ? JSON.parse(retainedImages) : retainedImages;
      } catch (e) {
        retainedPublicIds = [retainedImages]; // single item string
      }
    }

    // Determine which old images to delete
    const imagesToDelete = car.images.filter(img => !retainedPublicIds.includes(img.public_id));
    const finalImages = car.images.filter(img => retainedPublicIds.includes(img.public_id));

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
    if (brand) query.brand = brand;
    if (category) query.category = category;
    if (fuelType) query.fuelType = fuelType;
    if (transmission) query.transmission = transmission;
    if (seatingCapacity) query.seatingCapacity = { $gte: Number(seatingCapacity) };

    if (minPrice || maxPrice) {
      query.dailyPrice = {};
      if (minPrice) query.dailyPrice.$gte = Number(minPrice);
      if (maxPrice) query.dailyPrice.$lte = Number(maxPrice);
    }

    let sortOptions = { createdAt: -1 }; // default Newest
    if (sort === 'priceLowToHigh') sortOptions = { dailyPrice: 1 };
    if (sort === 'priceHighToLow') sortOptions = { dailyPrice: -1 };
    if (sort === 'oldest') sortOptions = { createdAt: 1 };

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

module.exports = {
  createCar,
  updateCar,
  deleteCar,
  getCars,
  getCarById
};
