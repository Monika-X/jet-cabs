const Car = require('../models/Car');
const User = require('../models/User');
const Booking = require('../models/Booking');

/**
 * @desc    Public statistics for the home page counters
 * @route   GET /api/stats
 * @access  Public
 */
const getPublicStats = async (req, res, next) => {
  try {
    const [totalCars, availableCars, totalCustomers, completedRentals, activeRentals] = await Promise.all([
      Car.countDocuments({}),
      Car.countDocuments({ status: 'Available', availableUnits: { $gt: 0 } }),
      User.countDocuments({ role: 'customer' }),
      Booking.countDocuments({ bookingStatus: 'Completed' }),
      Booking.countDocuments({ bookingStatus: { $in: ['Active', 'Extended'] } })
    ]);

    res.status(200).json({
      success: true,
      message: 'Stats fetched successfully',
      data: {
        totalCars,
        availableCars,
        totalCustomers,
        completedRentals,
        activeRentals
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPublicStats };
