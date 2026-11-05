const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer (memory storage since we upload directly to Cloudinary via stream)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

const {
  createCar,
  updateCar,
  deleteCar,
  getCars,
  getCarById,
  getFilterCounts,
  getCarAlternatives
} = require('../controllers/carController');

const { protect, authorize, optionalProtect } = require('../middleware/authMiddleware');

// Public Routes (Optional protect to identify if the user is an admin)
router.get('/', optionalProtect, getCars);
router.get('/filters', getFilterCounts);
router.get('/:id/alternatives', getCarAlternatives);
router.get('/:id', optionalProtect, getCarById);

// Admin Protected Routes
router.post('/', protect, authorize('admin'), upload.array('images', 10), createCar);
router.put('/:id', protect, authorize('admin'), upload.array('images', 10), updateCar);
router.delete('/:id', protect, authorize('admin'), deleteCar);

module.exports = router;
