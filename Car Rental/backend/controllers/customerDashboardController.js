const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

/**
 * @desc    Customer dashboard aggregate data
 * @route   GET /api/dashboard
 * @access  Private/Customer
 * Returns: current active rental, upcoming booking, rental history,
 *          recent notifications and profile summary — all from MongoDB.
 */
const getCustomerDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [profile, bookings, notifications] = await Promise.all([
      req.user,
      Booking.find({ customer: userId }).populate('car').sort('-createdAt'),
      Notification.find({ customer: userId }).sort('-createdAt').limit(50)
    ]);

    const now = new Date();
    const active = bookings.find(b =>
      b.bookingStatus === 'Active' || b.bookingStatus === 'Extended'
    ) || null;

    const upcoming = bookings.find(b =>
      b.bookingStatus === 'Pending Pickup' &&
      b.rentalDetails &&
      b.rentalDetails.pickupDateTime &&
      new Date(b.rentalDetails.pickupDateTime) >= now
    ) || null;

    const history = bookings.filter(b =>
      b.bookingStatus === 'Completed' || b.bookingStatus === 'Cancelled'
    );

    const unreadCount = notifications.reduce((sum, n) => sum + (n.isRead ? 0 : 1), 0);

    res.status(200).json({
      success: true,
      message: 'Customer dashboard data fetched successfully',
      data: {
        profile: {
          _id: profile._id,
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          profileImage: profile.profileImage,
          role: profile.role,
          createdAt: profile.createdAt
        },
        stats: {
          totalBookings: bookings.length,
          activeRentals: active ? 1 : 0,
          completedRentals: history.filter(b => b.bookingStatus === 'Completed').length,
          pendingPreBookings: bookings.filter(b => b.bookingStatus === 'Pending Pickup' && b.bookingType === 'PRE_BOOKING').length,
          unreadNotifications: unreadCount
        },
        currentActiveRental: active,
        upcomingBooking: upcoming,
        rentalHistory: history,
        recentNotifications: notifications
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCustomerDashboard };
