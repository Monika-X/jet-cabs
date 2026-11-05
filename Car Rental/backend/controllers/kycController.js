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

/**
 * @desc    Get all KYC submissions (admin)
 * @route   GET /api/admin/kyc
 * @access  Private/Admin
 */
const getAllKycSubmissions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const total = await KycSubmission.countDocuments(query);
    const submissions = await KycSubmission.find(query)
      .populate('customer', 'fullName email phone')
      .populate('reviewedBy', 'fullName email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      message: 'KYC submissions fetched successfully',
      data: submissions,
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
 * @desc    Approve a KYC submission (admin)
 * @route   PUT /api/admin/kyc/:id/approve
 * @access  Private/Admin
 */
const approveKyc = async (req, res, next) => {
  try {
    const submission = await KycSubmission.findById(req.params.id);
    if (!submission) {
      res.status(404);
      return next(new Error('KYC submission not found'));
    }

    if (submission.status !== 'PENDING') {
      res.status(409);
      return next(new Error(`KYC submission is already ${submission.status.toLowerCase()}.`));
    }

    submission.status = 'VERIFIED';
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = Date.now();
    await submission.save();

    res.status(200).json({
      success: true,
      message: 'KYC submission approved.',
      data: {
        submissionId: submission._id,
        status: submission.status,
        reviewedAt: submission.reviewedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a KYC submission (admin)
 * @route   PUT /api/admin/kyc/:id/reject
 * @access  Private/Admin
 */
const rejectKyc = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const submission = await KycSubmission.findById(req.params.id);
    if (!submission) {
      res.status(404);
      return next(new Error('KYC submission not found'));
    }

    if (submission.status !== 'PENDING') {
      res.status(409);
      return next(new Error(`KYC submission is already ${submission.status.toLowerCase()}.`));
    }

    submission.status = 'REJECTED';
    submission.rejectionReason = reason || 'No reason provided.';
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = Date.now();
    await submission.save();

    res.status(200).json({
      success: true,
      message: 'KYC submission rejected.',
      data: {
        submissionId: submission._id,
        status: submission.status,
        rejectionReason: submission.rejectionReason,
        reviewedAt: submission.reviewedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitKyc, getMyKycStatus, getAllKycSubmissions, approveKyc, rejectKyc };
