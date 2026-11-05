const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const { createNotification, clearReminders, TYPES } = require('../services/notificationService');

const getCarName = (car) => {
  if (!car) return 'the vehicle';
  const brand = car.brand || '';
  const rawName = car.carName || '';
  const model = rawName.startsWith(brand) ? rawName.slice(brand.length).trim() : rawName;
  return `${brand} ${model}`.replace(/\s+/g, ' ').trim() || 'the vehicle';
};

/**
 * @desc    List bookings with filters (admin)
 * @route   GET /api/admin/bookings
 * @access  Private/Admin
 */
const listBookings = async (req, res, next) => {
  try {
    const { status, bookingType, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') query.bookingStatus = status;
    if (bookingType && bookingType !== 'all') query.bookingType = bookingType;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    let total;
    if (search) {
      const matchedUsers = await mongoose.connection.db
        .collection('users')
        .find({
          $or: [
            { fullName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          ]
        })
        .project({ _id: 1 })
        .toArray();
      query.customer = { $in: matchedUsers.map(u => u._id) };
    }

    total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('car')
      .populate('customer', 'fullName email phone isSuspended')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      message: 'Bookings fetched successfully',
      data: bookings,
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
 * @desc    Update booking status (admin)
 * @route   PUT /api/admin/bookings/:id/status
 * @access  Private/Admin
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { bookingStatus } = req.body;
    if (!bookingStatus) {
      res.status(400);
      return next(new Error('Please provide a booking status.'));
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }

    const current = booking.bookingStatus;
    const allowed = ['Active', 'Completed'];
    if (!allowed.includes(bookingStatus)) {
      res.status(422);
      return next(new Error(`Status transition to '${bookingStatus}' is not allowed. Use Active or Completed.`));
    }
    if (current === bookingStatus) {
      res.status(409);
      return next(new Error(`Booking is already ${current}.`));
    }
    if (current === 'Completed' || current === 'Cancelled') {
      res.status(409);
      return next(new Error(`Cannot change a ${current.toLowerCase()} booking.`));
    }

    // Active requires the pickup photo so inventory was decremented consistently
    if (bookingStatus === 'Active') {
      if (current !== 'Pending Pickup' || !booking.pickupPhoto || !booking.pickupPhoto.url) {
        res.status(422);
        return next(new Error('Booking can only be activated after a pickup photo is uploaded.'));
      }
      // A Pending Pickup booking has never decremented inventory, so activation
      // must claim one unit (mirrors uploadPickupPhoto).
      const car = await Car.findById(booking.car);
      if (!car || car.availableUnits <= 0) {
        res.status(409);
        return next(new Error('Car is no longer available.'));
      }
      car.availableUnits = Math.max(0, car.availableUnits - 1);
      await car.save();
      booking.rentalStartTime = Date.now();
      booking.inventoryRestored = false;
    }

    // Completed from Active/Extended: restore inventory if no return photo exists
    if (bookingStatus === 'Completed' && (current === 'Active' || current === 'Extended')) {
      if (!booking.returnPhoto || !booking.returnPhoto.url) {
        const car = await Car.findById(booking.car);
        if (!car) {
          res.status(404);
          return next(new Error('Car not found'));
        }
        car.availableUnits = Math.min(car.availableUnits + 1, car.totalUnits);
        await car.save();
        booking.inventoryRestored = true;
      }
      if (!booking.rentalEndTime) booking.rentalEndTime = Date.now();
    }

    booking.bookingStatus = bookingStatus;
    await booking.save();

    const populated = await Booking.findById(booking._id).populate('car');

    if (bookingStatus === 'Completed') {
      createNotification({
        customer: booking.customer,
        booking: booking._id,
        title: 'Rental Completed',
        message: `Your rental for ${getCarName(populated.car)} has been marked as completed.`,
        type: TYPES.RENTAL_COMPLETED
      });
      clearReminders(booking._id);
    } else if (bookingStatus === 'Active') {
      createNotification({
        customer: booking.customer,
        booking: booking._id,
        title: 'Rental Started',
        message: `Your rental for ${getCarName(populated.car)} is now active.`,
        type: TYPES.RENTAL_STARTED
      });
    }

    res.status(200).json({ success: true, message: 'Booking status updated successfully.', data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel any non-terminal booking (admin)
 * @route   PUT /api/admin/bookings/:id/cancel
 * @access  Private/Admin
 */
const cancelBookingAdmin = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }

    if (booking.bookingStatus === 'Completed' || booking.bookingStatus === 'Cancelled') {
      res.status(409);
      return next(new Error('Booking is already completed or cancelled.'));
    }

    const wasActive = booking.bookingStatus === 'Active' || booking.bookingStatus === 'Extended';
    if (wasActive && !booking.inventoryRestored) {
      const car = await Car.findById(booking.car);
      if (car) {
        car.availableUnits = Math.min(car.availableUnits + 1, car.totalUnits);
        await car.save();
      }
      booking.inventoryRestored = true;
    }

    booking.bookingStatus = 'Cancelled';
    await booking.save();

    clearReminders(booking._id);
    createNotification({
      customer: booking.customer,
      booking: booking._id,
      title: 'Booking Cancelled',
      message: wasActive
        ? 'Your active rental has been cancelled by JET CABS. Any applicable adjustments will be applied.'
        : 'Your booking has been cancelled by JET CABS.',
      type: TYPES.BOOKING_CANCELLED
    });

    res.status(200).json({ success: true, message: 'Booking cancelled successfully.', data: booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign a vehicle to a pending booking (admin)
 * @route   PUT /api/admin/bookings/:id/assign-vehicle
 * @access  Private/Admin
 */
const assignVehicle = async (req, res, next) => {
  try {
    const { carId } = req.body;
    if (!carId) {
      res.status(400);
      return next(new Error('Please provide a carId.'));
    }
    if (!mongoose.isValidObjectId(carId)) {
      res.status(400);
      return next(new Error('Invalid carId format.'));
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }
    if (booking.bookingStatus !== 'Pending Pickup') {
      res.status(422);
      return next(new Error('Only pending bookings can be assigned a vehicle.'));
    }

    const car = await Car.findById(carId);
    if (!car) {
      res.status(404);
      return next(new Error('Car not found'));
    }
    if (car.status !== 'Available' || car.availableUnits <= 0) {
      res.status(409);
      return next(new Error('The selected vehicle is currently unavailable.'));
    }

    booking.car = carId;
    await booking.save();

    createNotification({
      customer: booking.customer,
      booking: booking._id,
      title: 'Vehicle Assigned',
      message: `A vehicle has been assigned to your booking: ${getCarName(car)}.`,
      type: TYPES.VEHICLE_ASSIGNED
    });

    const updated = await Booking.findById(booking._id).populate('car');
    res.status(200).json({ success: true, message: 'Vehicle assigned successfully.', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve an extension request (admin)
 * @route   PUT /api/admin/bookings/:id/extensions/:extensionId/approve
 * @access  Private/Admin
 */
const approveExtension = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('car');
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }

    const extension = booking.extensionHistory.id(req.params.extensionId);
    if (!extension) {
      res.status(404);
      return next(new Error('Extension record not found'));
    }
    if (extension.status !== 'pending') {
      res.status(409);
      return next(new Error(`Extension request is already ${extension.status === 'approved' ? 'approved' : 'rejected'}.`));
    }

    // Apply the extension: shift return time, add the charge, mark approved.
    if (booking.rentalDetails.returnDateTime) {
      const returnDate = new Date(booking.rentalDetails.returnDateTime);
      returnDate.setHours(returnDate.getHours() + Number(extension.additionalHours));
      booking.rentalDetails.returnDateTime = returnDate;
    }
    extension.status = 'approved';
    extension.approvedAt = Date.now();
    booking.bookingStatus = 'Extended';
    booking.totalAmount = (booking.totalAmount || 0) + extension.additionalAmount;

    await booking.save();

    // Drop old reminders so the scheduler recalculates against the new return time
    clearReminders(booking._id);
    createNotification({
      customer: booking.customer,
      booking: booking._id,
      title: 'Extension Approved',
      message: `Your extension request for ${getCarName(booking.car)} was approved. New return time: ${booking.rentalDetails.returnDateTime ? new Date(booking.rentalDetails.returnDateTime).toLocaleString() : 'TBA'}.`,
      type: TYPES.RENTAL_EXTENDED
    });

    res.status(200).json({
      success: true,
      message: 'Extension approved and applied to the booking.',
      data: {
        extensionId: extension._id,
        additionalHours: extension.additionalHours,
        additionalAmount: extension.additionalAmount,
        returnDateTime: booking.rentalDetails.returnDateTime,
        bookingStatus: booking.bookingStatus,
        totalAmount: booking.totalAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject an extension request (admin)
 * @route   PUT /api/admin/bookings/:id/extensions/:extensionId/reject
 * @access  Private/Admin
 */
const rejectExtension = async (req, res, next) => {
  try {
    const { reason } = req.body || {};
    const booking = await Booking.findById(req.params.id).populate('car');
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }

    const extension = booking.extensionHistory.id(req.params.extensionId);
    if (!extension) {
      res.status(404);
      return next(new Error('Extension record not found'));
    }
    if (extension.status !== 'pending') {
      res.status(409);
      return next(new Error(`Extension request is already ${extension.status === 'approved' ? 'approved' : 'rejected'}.`));
    }

    extension.status = 'rejected';
    extension.rejectedAt = Date.now();
    extension.rejectionReason = reason || 'Requested extension was not approved.';
    await booking.save();

    createNotification({
      customer: booking.customer,
      booking: booking._id,
      title: 'Extension Request Rejected',
      message: `Unfortunately, your extension request for ${getCarName(booking.car)} was not approved.${reason ? ` Reason: ${reason}` : ''}`,
      type: TYPES.EXTENSION_REJECTED
    });

    res.status(200).json({ success: true, message: 'Extension request rejected and customer notified.', data: booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Suggest an alternative vehicle for a booking (admin)
 * @route   POST /api/admin/bookings/:id/suggest-alternative
 * @access  Private/Admin
 */
const suggestAlternative = async (req, res, next) => {
  try {
    const { carId, message } = req.body;
    if (!carId) {
      res.status(400);
      return next(new Error('Please provide a suggested carId.'));
    }
    if (!mongoose.isValidObjectId(carId)) {
      res.status(400);
      return next(new Error('Invalid carId format.'));
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }
    if (booking.bookingType !== 'PRE_BOOKING' || booking.bookingStatus !== 'Pending Pickup') {
      res.status(422);
      return next(new Error('Alternatives can only be suggested for pending pre-bookings.'));
    }

    const car = await Car.findById(carId);
    if (!car) {
      res.status(404);
      return next(new Error('Car not found'));
    }
    if (car.status !== 'Available' || car.availableUnits <= 0) {
      res.status(409);
      return next(new Error('The suggested vehicle is currently unavailable.'));
    }

    booking.preBookingStatus = 'Alternative Suggested';
    booking.suggestedAlternative = {
      car: car._id,
      message: message || '',
      suggestedAt: Date.now()
    };
    await booking.save();

    createNotification({
      customer: booking.customer,
      booking: booking._id,
      title: 'Alternative Vehicle Suggested',
      message: `As a substitute for your booking, we suggest ${getCarName(car)}.${message ? ` Note: ${message}` : ''}`,
      type: TYPES.ALTERNATIVE_SUGGESTED
    });

    res.status(200).json({
      success: true,
      message: 'Alternative vehicle suggestion sent to customer.',
      data: {
        bookingId: booking._id,
        suggestedCar: { _id: car._id, carName: car.carName, brand: car.brand },
        message: message || ''
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve a pre-booking request (admin)
 * @route   POST /api/admin/bookings/:id/approve-pre-booking
 * @access  Private/Admin
 */
const approvePreBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('car');
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }
    if (booking.bookingType !== 'PRE_BOOKING') {
      res.status(422);
      return next(new Error('Only pre-bookings can be approved through this flow.'));
    }
    if (booking.bookingStatus !== 'Pending Pickup') {
      res.status(409);
      return next(new Error('Pre-booking is no longer pending.'));
    }

    // Refuse approval when the requested vehicle is no longer bookable —
    // the admin should offer an alternative instead.
    const car = booking.car || await Car.findById(booking.car);
    if (!car || car.status !== 'Available' || car.availableUnits <= 0) {
      res.status(409);
      return next(new Error('The requested vehicle is no longer available. Consider suggesting an alternative.'));
    }

    booking.preBookingStatus = 'Approved';
    await booking.save();

    createNotification({
      customer: booking.customer,
      booking: booking._id,
      title: 'Pre-Booking Approved',
      message: `Your pre-booking for ${getCarName(booking.car)} has been approved. Proceed with your pickup as planned.`,
      type: TYPES.PREBOOKING_APPROVED
    });

    res.status(200).json({ success: true, message: 'Pre-booking approved and customer notified.', data: booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a pre-booking request (admin)
 * @route   POST /api/admin/bookings/:id/reject-pre-booking
 * @access  Private/Admin
 */
const rejectPreBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id).populate('car');
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }
    if (booking.bookingType !== 'PRE_BOOKING') {
      res.status(422);
      return next(new Error('Only pre-bookings can be rejected through this flow.'));
    }
    if (booking.bookingStatus !== 'Pending Pickup') {
      res.status(409);
      return next(new Error('Pre-booking is no longer pending.'));
    }

    booking.bookingStatus = 'Cancelled';
    booking.preBookingStatus = 'Rejected';
    await booking.save();

    clearReminders(booking._id);
    createNotification({
      customer: booking.customer,
      booking: booking._id,
      title: 'Pre-Booking Rejected',
      message: `Unfortunately, your pre-booking for ${getCarName(booking.car)} could not be processed.${reason ? ` Reason: ${reason}` : ''}`,
      type: TYPES.PREBOOKING_REJECTED
    });

    res.status(200).json({ success: true, message: 'Pre-booking rejected and customer notified.', data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listBookings,
  updateBookingStatus,
  cancelBookingAdmin,
  assignVehicle,
  approveExtension,
  rejectExtension,
  suggestAlternative,
  approvePreBooking,
  rejectPreBooking
};
