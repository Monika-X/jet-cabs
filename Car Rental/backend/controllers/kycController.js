const KycSubmission = require('../models/KycSubmission');

/**
 * @desc    Submit a KYC verification record
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

    const submission = await KycSubmission.create({
      customer: req.user._id,
      fullName,
      email,
      phone,
      documentType,
      documentNumber,
      idFrontName: idFrontName || '',
      idBackName: idBackName || '',
      licenseFrontName: licenseFrontName || '',
      licenseBackName: licenseBackName || ''
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
