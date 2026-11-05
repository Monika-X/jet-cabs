const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/bookingController');

// Multer config for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

router.route('/')
  .post(protect, createBooking)
  .get(protect, authorize('admin'), getAllBookings);

router.route('/my-bookings')
  .get(protect, getMyBookings);

router.route('/:id')
  .get(protect, getBookingById);

router.route('/:id/pickup-photo')
  .put(protect, upload.single('pickupPhoto'), uploadPickupPhoto);

router.route('/:id/return-photo')
  .put(protect, upload.single('returnPhoto'), uploadReturnPhoto);

router.route('/:id/extend')
  .put(protect, extendRental);

router.route('/:id/cancel')
  .put(protect, cancelBooking);

router.route('/:id/accept-alternative')
  .post(protect, acceptAlternative);

router.route('/:id/decline-alternative')
  .post(protect, declineAlternative);

module.exports = router;
