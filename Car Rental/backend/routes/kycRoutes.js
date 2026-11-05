const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { submitKyc, getMyKycStatus } = require('../controllers/kycController');
const { uploadToCloudinary } = require('../utils/uploadToCloudinary');

// Multer config for KYC document uploads (memory storage → Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Not a valid file! Please upload an image or PDF.'), false);
    }
  }
});

router.route('/')
  .post(protect, upload.fields([
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 },
    { name: 'licenseFront', maxCount: 1 },
    { name: 'licenseBack', maxCount: 1 }
  ]), submitKyc);

router.route('/mine')
  .get(protect, getMyKycStatus);

module.exports = router;
