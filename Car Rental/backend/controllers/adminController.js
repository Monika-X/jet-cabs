const User = require('../models/User');
const Car = require('../models/Car');
const Booking = require('../models/Booking');

/**
 * @desc    Get all dashboard aggregated data
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
const getDashboardData = async (req, res, next) => {
  try {
    const [users, cars, bookings] = await Promise.all([
      User.find({}).select('-password -resetPasswordToken -resetPasswordExpire').sort('-createdAt'),
      Car.find({}).sort('-createdAt'),
      Booking.find({}).populate('car customer').sort('-createdAt')
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        cars,
        bookings
      }
    });
  } catch (error) {
    next(error);
  }
};

const REVENUE_STATUSES = ['Completed', 'Active', 'Extended'];

/**
 * @desc    Dashboard statistics summary
 * @route   GET /api/admin/analytics/summary
 * @access  Private/Admin
 */
const getAnalyticsSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCars, availableCars, bookingCounts, revenueAgg, customerCount] = await Promise.all([
      Car.countDocuments({}),
      Car.countDocuments({ status: 'Available', availableUnits: { $gt: 0 } }),
      Booking.aggregate([
        { $group: { _id: '$bookingStatus', count: { $sum: 1 } } }
      ]),
      Booking.aggregate([
        { $match: { bookingStatus: { $in: REVENUE_STATUSES } } },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$totalAmount', 0] } },
            today: {
              $sum: { $cond: [{ $gte: ['$createdAt', startOfToday] }, { $ifNull: ['$totalAmount', 0] }, 0] }
            },
            month: {
              $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, { $ifNull: ['$totalAmount', 0] }, 0] }
            }
          }
        }
      ]),
      User.countDocuments({ role: 'customer' })
    ]);

    const statusMap = {};
    bookingCounts.forEach(b => { statusMap[b._id] = b.count; });

    const revenue = revenueAgg[0] || { total: 0, today: 0, month: 0 };

    res.status(200).json({
      success: true,
      message: 'Dashboard analytics fetched successfully',
      data: {
        totalCars,
        availableCars,
        activeRentals: (statusMap['Active'] || 0) + (statusMap['Extended'] || 0),
        completedRentals: statusMap['Completed'] || 0,
        cancelledBookings: statusMap['Cancelled'] || 0,
        pendingBookings: statusMap['Pending Pickup'] || 0,
        totalCustomers: customerCount,
        totalRevenue: Math.round(revenue.total * 100) / 100,
        todayRevenue: Math.round(revenue.today * 100) / 100,
        monthRevenue: Math.round(revenue.month * 100) / 100
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Booking analytics (daily/weekly/monthly trends, status mix, top cars, active customers)
 * @route   GET /api/admin/analytics/bookings
 * @access  Private/Admin
 */
const getBookingAnalytics = async (req, res, next) => {
  try {
    const days = Math.max(1, Math.min(parseInt(req.query.days, 10) || 30, 90));
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const [daily, weekly, monthly, statusDistribution, topCars, activeCustomers] = await Promise.all([
      Booking.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            revenue: { $sum: { $cond: [{ $in: ['$bookingStatus', REVENUE_STATUSES] }, { $ifNull: ['$totalAmount', 0] }, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%G-W%V', date: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: { $cond: [{ $in: ['$bookingStatus', REVENUE_STATUSES] }, { $ifNull: ['$totalAmount', 0] }, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
            revenue: { $sum: { $cond: [{ $in: ['$bookingStatus', REVENUE_STATUSES] }, { $ifNull: ['$totalAmount', 0] }, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Booking.aggregate([
        { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Booking.aggregate([
        { $group: { _id: '$car', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'cars',
            localField: '_id',
            foreignField: '_id',
            as: 'car'
          }
        },
        { $unwind: { path: '$car', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            carId: '$_id',
            name: { $concat: ['$car.brand', ' ', '$car.carName'] },
            category: '$car.category',
            image: { $arrayElemAt: [{ $ifNull: ['$car.images', []] }, 0] },
            count: 1
          }
        }
      ]),
      Booking.aggregate([
        { $group: { _id: '$customer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            customerId: '$_id',
            name: '$user.fullName',
            email: '$user.email',
            phone: '$user.phone',
            count: 1
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      message: 'Booking analytics fetched successfully',
      data: {
        range: { days },
        daily,
        weekly,
        monthly,
        statusDistribution,
        topCars,
        activeCustomers
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List users (admin) with search + pagination
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: users,
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
 * @desc    Suspend or activate a customer account
 * @route   PUT /api/admin/users/:id/suspend | /activate
 * @access  Private/Admin
 */
const setUserSuspension = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (user.role === 'admin') {
      res.status(400);
      return next(new Error('Admin accounts cannot be suspended.'));
    }

    const suspending = req.path.endsWith('/suspend');
    if (user.isSuspended === suspending) {
      res.status(409);
      return next(new Error(`User is already ${suspending ? 'suspended' : 'active'}.`));
    }

    user.isSuspended = suspending;
    await user.save();

    res.status(200).json({
      success: true,
      message: suspending ? 'Customer suspended successfully.' : 'Customer activated successfully.',
      data: { _id: user._id, fullName: user.fullName, email: user.email, isSuspended: user.isSuspended }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData,
  getAnalyticsSummary,
  getBookingAnalytics,
  getUsers,
  setUserSuspension
};
