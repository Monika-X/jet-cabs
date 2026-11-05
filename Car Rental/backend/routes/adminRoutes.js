const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  getAdminProfile
} = require('../controllers/adminAuthController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateLogin } = require('../validators/authValidator');
const {
  getDashboardData,
  getAnalyticsSummary,
  getBookingAnalytics,
  getUsers,
  setUserSuspension
} = require('../controllers/adminController');
const {
  listBookings,
  updateBookingStatus,
  cancelBookingAdmin,
  assignVehicle,
  approveExtension,
  rejectExtension,
  suggestAlternative,
  approvePreBooking,
  rejectPreBooking
} = require('../controllers/adminBookingController');
const {
  getAllTickets,
  updateTicketStatus
} = require('../controllers/ticketController');
const {
  getAllKycSubmissions,
  approveKyc,
  rejectKyc
} = require('../controllers/kycController');

router.post('/login', validateLogin, loginAdmin);
router.get('/profile', protect, authorize('admin'), getAdminProfile);
router.get('/dashboard', protect, authorize('admin'), getDashboardData);

// Analytics
router.get('/analytics/summary', protect, authorize('admin'), getAnalyticsSummary);
router.get('/analytics/bookings', protect, authorize('admin'), getBookingAnalytics);

// Users
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id/suspend', protect, authorize('admin'), setUserSuspension);
router.put('/users/:id/activate', protect, authorize('admin'), setUserSuspension);

// Bookings
router.get('/bookings', protect, authorize('admin'), listBookings);
router.put('/bookings/:id/status', protect, authorize('admin'), updateBookingStatus);
router.put('/bookings/:id/cancel', protect, authorize('admin'), cancelBookingAdmin);
router.put('/bookings/:id/assign-vehicle', protect, authorize('admin'), assignVehicle);
router.post('/bookings/:id/suggest-alternative', protect, authorize('admin'), suggestAlternative);
router.post('/bookings/:id/approve-pre-booking', protect, authorize('admin'), approvePreBooking);
router.post('/bookings/:id/reject-pre-booking', protect, authorize('admin'), rejectPreBooking);
router.put('/bookings/:id/extensions/:extensionId/approve', protect, authorize('admin'), approveExtension);
router.put('/bookings/:id/extensions/:extensionId/reject', protect, authorize('admin'), rejectExtension);

// Support tickets
router.get('/support/tickets', protect, authorize('admin'), getAllTickets);
router.put('/support/tickets/:id', protect, authorize('admin'), updateTicketStatus);

// KYC management
router.get('/kyc', protect, authorize('admin'), getAllKycSubmissions);
router.put('/kyc/:id/approve', protect, authorize('admin'), approveKyc);
router.put('/kyc/:id/reject', protect, authorize('admin'), rejectKyc);

module.exports = router;
