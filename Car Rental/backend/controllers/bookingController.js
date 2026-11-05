const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const { uploadToCloudinary } = require('../utils/uploadToCloudinary');
const { createNotification, clearReminders, TYPES } = require('../services/notificationService');

const getCarName = (car) => {
  if (!car) return 'the vehicle';
  const brand = car.brand || '';
  const rawName = car.carName || '';
  const model = rawName.startsWith(brand) ? rawName.slice(brand.length).trim() : rawName;
  return `${brand} ${model}`.replace(/\s+/g, ' ').trim() || 'the vehicle';
};

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Private
 */
const createBooking = async (req, res, next) => {
  try {
    const {
      flowType,
      vehicleId,
      rentalDetails,
      customer, // For DIRECT_BOOKING, we use req.body.customer. fullName etc. But we must set booking.customer to req.user._id
      estimatedPricing
    } = req.body;
    const customerDetails = customer || req.body.customerDetails;

    if (!flowType || !['PRE_BOOKING', 'DIRECT_BOOKING'].includes(flowType)) {
      res.status(400);
      return next(new Error("flowType must be 'PRE_BOOKING' or 'DIRECT_BOOKING'."));
    }
    if (!rentalDetails || !rentalDetails.pickupDateTime || !rentalDetails.returnDateTime) {
      res.status(400);
      return next(new Error('rentalDetails.pickupDateTime and returnDateTime are required.'));
    }
    const pickupDt = new Date(rentalDetails.pickupDateTime);
    const returnDt = new Date(rentalDetails.returnDateTime);
    if (isNaN(pickupDt.getTime()) || isNaN(returnDt.getTime())) {
      res.status(400);
      return next(new Error('Invalid pickup or return date/time.'));
    }
    if (returnDt <= pickupDt) {
      res.status(400);
      return next(new Error('Return time must be after pickup time.'));
    }
    if (!customerDetails || !customerDetails.fullName || !customerDetails.email || !customerDetails.phone) {
      res.status(400);
      return next(new Error('Customer full name, email and phone are required.'));
    }
    if (!estimatedPricing || !estimatedPricing.baseCharge || !estimatedPricing.taxes || !estimatedPricing.estimatedTotal) {
      res.status(400);
      return next(new Error('estimatedPricing.baseCharge, taxes and estimatedTotal are required.'));
    }

    const car = await Car.findById(vehicleId);
    if (!car) {
      res.status(404);
      return next(new Error('Car not found'));
    }

    if (car.availableUnits <= 0) {
      res.status(409); // 409 Conflict
      return next(new Error('Vehicle is currently unavailable for booking.'));
    }

    // Duplicate booking prevention: same customer + same car + overlapping
    // window while the earlier booking is still pending.
    if (rentalDetails && rentalDetails.pickupDateTime && rentalDetails.returnDateTime) {
      const duplicate = await Booking.findOne({
        customer: req.user._id,
        car: vehicleId,
        bookingStatus: 'Pending Pickup',
        $or: [
          {
            'rentalDetails.pickupDateTime': { $lt: new Date(rentalDetails.returnDateTime) },
            'rentalDetails.returnDateTime': { $gt: new Date(rentalDetails.pickupDateTime) }
          }
        ]
      });
      if (duplicate) {
        res.status(409);
        return next(new Error('You already have a pending booking for this vehicle in the same time window.'));
      }
    }

    // Creating booking does NOT decrease inventory.
    const booking = new Booking({
      customer: req.user._id,
      car: vehicleId,
      bookingType: flowType,
      bookingStatus: 'Pending Pickup',
      rentalDetails,
      customerDetails,
      estimatedPricing,
      totalAmount: estimatedPricing ? estimatedPricing.estimatedTotal : 0
    });

    const createdBooking = await booking.save();

    // Notification: Booking Confirmed
    createNotification({
      customer: req.user._id,
      booking: createdBooking._id,
      title: 'Booking Confirmed',
      message: `Your booking for ${getCarName(car)} is confirmed. ${car.availableUnits > 0 ? 'The vehicle is reserved for your pickup.' : ''}`,
      type: TYPES.BOOKING_CONFIRMED
    });

    res.status(201).json({ success: true, data: createdBooking, message: 'Booking created successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged in user bookings
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate('car')
      .populate('suggestedAlternative.car')
      .sort('-createdAt');
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all bookings (Admin)
 * @route   GET /api/bookings
 * @access  Private/Admin
 */
const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate('customer', 'fullName email phone').populate('car').sort('-createdAt');
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single booking
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('customer', 'fullName email phone').populate('car');
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }

    // Make sure user owns booking or is admin
    if (booking.customer._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized to access this booking.'));
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload Pickup Photo and Active Rental
 * @route   PUT /api/bookings/:id/pickup-photo
 * @access  Private
 */
const uploadPickupPhoto = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }

    if (booking.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized.'));
    }

    if (booking.bookingStatus !== 'Pending Pickup') {
      res.status(400);
      return next(new Error('Cannot upload pickup photo for a booking that is not Pending Pickup.'));
    }

    if (!req.file) {
      res.status(400);
      return next(new Error('Please upload a pickup photo.'));
    }

    // 1. Check if car is still available
    const car = await Car.findById(booking.car);
    if (!car || car.availableUnits <= 0) {
      res.status(409);
      return next(new Error('Car is no longer available.'));
    }

    // 2. Upload to cloudinary
    let uploadedImage;
    try {
      uploadedImage = await uploadToCloudinary(req.file.buffer, 'bookings');
    } catch (err) {
      res.status(500);
      return next(new Error('Failed to upload image. Inventory unchanged.'));
    }

    // 3. Update Booking and Car
    booking.pickupPhoto = {
      public_id: uploadedImage.public_id,
      url: uploadedImage.secure_url
    };
    booking.bookingStatus = 'Active';
    booking.rentalStartTime = Date.now();
    booking.inventoryRestored = false;

    await booking.save();

    car.availableUnits -= 1;
    await car.save();

    // Notification: Rental Started
    createNotification({
      customer: booking.customer,
      booking: booking._id,
      title: 'Rental Started',
      message: `You have picked up ${getCarName(car)}. Enjoy your ride!`,
      type: TYPES.RENTAL_STARTED
    });

    res.status(200).json({ success: true, message: 'Pickup photo uploaded and rental activated.', data: booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload Return Photo and Complete Rental
 * @route   PUT /api/bookings/:id/return-photo
 * @access  Private
 */
const uploadReturnPhoto = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }

    if (booking.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized.'));
    }

    if (booking.bookingStatus !== 'Active' && booking.bookingStatus !== 'Extended') {
      res.status(400);
      return next(new Error('Return photo can only be uploaded for Active or Extended rentals.'));
    }

    if (!req.file) {
      res.status(400);
      return next(new Error('Please upload a return photo.'));
    }

    const car = await Car.findById(booking.car);
    if (!car) {
      res.status(404);
      return next(new Error('Car not found'));
    }

    let uploadedImage;
    try {
      uploadedImage = await uploadToCloudinary(req.file.buffer, 'bookings');
    } catch (err) {
      res.status(500);
      return next(new Error('Failed to upload image. Inventory unchanged.'));
    }

    booking.returnPhoto = {
      public_id: uploadedImage.public_id,
      url: uploadedImage.secure_url
    };
    booking.bookingStatus = 'Completed';
    booking.rentalEndTime = Date.now();
    booking.inventoryRestored = true;
    await booking.save();

    car.availableUnits += 1;
    await car.save();

    // Notification: Rental Completed + stop any pending reminders for this booking
    createNotification({
      customer: booking.customer,
      booking: booking._id,
      title: 'Rental Completed',
      message: `Thank you for returning ${getCarName(car)}. Your rental has been completed successfully.`,
      type: TYPES.RENTAL_COMPLETED
    });
    clearReminders(booking._id);

    res.status(200).json({ success: true, message: 'Return photo uploaded and rental completed.', data: booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Extend Rental
 * @route   PUT /api/bookings/:id/extend
 * @access  Private
 */
const extendRental = async (req, res, next) => {
  try {
    const { additionalHours } = req.body;
    if (!additionalHours || additionalHours <= 0) {
      res.status(400);
      return next(new Error('Please provide valid additional hours.'));
    }

    const booking = await Booking.findById(req.params.id).populate('car');
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }

    if (booking.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized.'));
    }

    if (booking.bookingStatus !== 'Active' && booking.bookingStatus !== 'Extended') {
      res.status(400);
      return next(new Error('Only active rentals can be extended.'));
    }

    const rate = booking.rentalDetails.rentalType === 'hourly' ? booking.car.hourlyPrice : (booking.car.dailyPrice / 24);
    const additionalAmount = additionalHours * rate;

    // Prevent stacking multiple pending requests for the same rental
    const hasPending = booking.extensionHistory.some(ext => ext.status === 'pending');
    if (hasPending) {
      res.status(409);
      return next(new Error('You already have an extension request awaiting review.'));
    }

    // Extension requests are queued for admin review. The return time and total
    // are only changed once an admin approves the request.
    booking.extensionHistory.push({
      additionalHours,
      additionalAmount,
      extendedAt: Date.now(),
      status: 'pending'
    });

    await booking.save();

    // Notification: Extension Requested + drop old reminders so the scheduler
    // does not fire against stale timings while the request is being reviewed.
    createNotification({
      customer: booking.customer,
      booking: booking._id,
      title: 'Extension Request Submitted',
      message: `Your request to extend the rental for ${getCarName(booking.car)} by ${additionalHours} hour(s) has been submitted. Our team will review it shortly.`,
      type: TYPES.EXTENSION_REQUESTED
    });
    clearReminders(booking._id);

    res.status(200).json({ success: true, message: 'Extension request submitted for review.', data: booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept a suggested alternative vehicle for a pre-booking
 * @route   POST /api/bookings/:id/accept-alternative
 * @access  Private
 */
const acceptAlternative = async (req, res, next) => {
  try {
    const { carId } = req.body;
    if (!carId) {
      res.status(400);
      return next(new Error('Please provide the suggested carId.'));
    }

    const booking = await Booking.findById(req.params.id).populate('car');
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }
    if (booking.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized.'));
    }
    if (booking.bookingType !== 'PRE_BOOKING' || booking.bookingStatus !== 'Pending Pickup') {
      res.status(422);
      return next(new Error('Only pending pre-bookings can accept an alternative vehicle.'));
    }
    if (booking.preBookingStatus === 'Alternative Accepted') {
      res.status(409);
      return next(new Error('You have already accepted the suggested alternative.'));
    }

    const car = await Car.findById(carId);
    if (!car) {
      res.status(404);
      return next(new Error('Car not found'));
    }
    if (car.status !== 'Available' || car.availableUnits <= 0) {
      res.status(409);
      return next(new Error('The suggested vehicle is no longer available.'));
    }
    if (String(booking.car._id) === String(car._id)) {
      res.status(409);
      return next(new Error('The suggested vehicle is the same as your original booking.'));
    }

    // Recompute the price estimate against the new vehicle's rates
    const hours = Math.max(1, Math.round((new Date(booking.rentalDetails.returnDateTime) - new Date(booking.rentalDetails.pickupDateTime)) / 3600000));
    const isHourly = booking.rentalDetails.rentalType === 'hourly';
    const unitPrice = isHourly ? (car.hourlyPrice || 0) : (car.dailyPrice || 0);
    const units = isHourly ? hours : Math.ceil(hours / 24);
    const baseCharge = unitPrice * units;
    const taxes = Math.round(baseCharge * 0.1 * 100) / 100;

    booking.car = car._id;
    booking.preBookingStatus = 'Alternative Accepted';
    booking.suggestedAlternative = undefined;
    booking.estimatedPricing = {
      baseCharge,
      taxes,
      estimatedTotal: baseCharge + taxes
    };
    booking.totalAmount = baseCharge + taxes;

    await booking.save();

    createNotification({
      customer: booking.customer,
      booking: booking._id,
      title: 'Alternative Vehicle Accepted',
      message: `You have accepted ${getCarName(car)} as the replacement for your pre-booking. Your pickup is confirmed with this vehicle.`,
      type: TYPES.VEHICLE_ASSIGNED
    });

    const updated = await Booking.findById(booking._id).populate('car');
    res.status(200).json({ success: true, message: 'Alternative vehicle accepted. Your booking has been updated.', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Decline a suggested alternative vehicle for a pre-booking
 * @route   POST /api/bookings/:id/decline-alternative
 * @access  Private
 */
const declineAlternative = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }
    if (booking.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized.'));
    }
    if (booking.bookingType !== 'PRE_BOOKING' || booking.bookingStatus !== 'Pending Pickup') {
      res.status(422);
      return next(new Error('Only pending pre-bookings can decline an alternative vehicle.'));
    }
    if (booking.preBookingStatus === 'Alternative Accepted') {
      res.status(409);
      return next(new Error('The alternative has already been accepted.'));
    }
    if (booking.preBookingStatus === 'Alternative Declined') {
      res.status(409);
      return next(new Error('You have already declined the suggested alternative.'));
    }

    booking.preBookingStatus = 'Alternative Declined';
    await booking.save();

    res.status(200).json({ success: true, message: 'Alternative declined. An agent will contact you shortly.', data: booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel Booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private
 */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }

    if (booking.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized.'));
    }

    if (booking.bookingStatus !== 'Pending Pickup') {
      res.status(400);
      return next(new Error('Cannot cancel a booking that is active or already completed.'));
    }

    booking.bookingStatus = 'Cancelled';
    await booking.save();

    // Stop scheduling future reminders for a cancelled booking
    clearReminders(booking._id);

    res.status(200).json({ success: true, message: 'Booking cancelled.', data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  uploadPickupPhoto,
  uploadReturnPhoto,
  extendRental,
  cancelBooking,
  acceptAlternative,
  declineAlternative
};
