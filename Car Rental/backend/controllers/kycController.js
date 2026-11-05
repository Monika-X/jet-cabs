const KycSubmission = require('../models/KycSubmission');
const { uploadToCloudinary } = require('../utils/uploadToCloudinary');

/**
 * @desc    Submit a KYC verification record with document uploads to Cloudinary
 * @route   POST /api/kyc
 * @access  Private
 */
const submitKyc = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      documentType,
      documentNumber,
      idFrontName,
      idBackName,
      licenseFrontName,
      licenseBackName
    } = req.body;

    if (!fullName || !email || !phone || !documentType || !documentNumber) {
      res.status(400);
      return next(new Error('Full name, email, phone, document type and document number are required.'));
    }

    // Upload document images to Cloudinary
    const uploadFields = async (file) => {
      if (!file) return '';
      const result = await uploadToCloudinary(file.buffer, 'car-rental/kyc');
      return result.secure_url;
    };

    const [idFrontUrl, idBackUrl, licenseFrontUrl, licenseBackUrl] = await Promise.all([
      uploadFields(req.files && req.files['idFront'] ? req.files['idFront'][0] : null),
      uploadFields(req.files && req.files['idBack'] ? req.files['idBack'][0] : null),
      uploadFields(req.files && req.files['licenseFront'] ? req.files['licenseFront'][0] : null),
      uploadFields(req.files && req.files['licenseBack'] ? req.files['licenseBack'][0] : null)
    ]);

    const submission = await KycSubmission.create({
      customer: req.user._id,
      fullName,
      email,
      phone,
      documentType,
      documentNumber,
      idFrontName: idFrontName || idFrontUrl || '',
      idBackName: idBackName || idBackUrl || '',
      licenseFrontName: licenseFrontName || licenseFrontUrl || '',
      licenseBackName: licenseBackName || licenseBackUrl || ''
    });

    res.status(201).json({
      success: true,
      message: 'KYC details submitted for verification.',
      data: {
        submissionId: submission._id,
        status: submission.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the latest KYC submission status for the current customer
 * @route   GET /api/kyc/mine
 * @access  Private
 */
const getMyKycStatus = async (req, res, next) => {
  try {
    const latest = await KycSubmission.findOne({ customer: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: 'KYC status fetched successfully.',
      data: {
        status: latest ? latest.status : 'NOT_SUBMITTED'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitKyc, getMyKycStatus };
