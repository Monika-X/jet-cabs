const Ticket = require('../models/Ticket');

/**
 * @desc    Create a support ticket or submit feedback
 * @route   POST /api/support/tickets
 * @access  Private/Customer
 */
const createTicket = async (req, res, next) => {
  try {
    const { category, subject, message } = req.body;

    if (!subject || !message) {
      res.status(422);
      return next(new Error('Subject and message are required.'));
    }

    const ticket = await Ticket.create({
      customer: req.user._id,
      category: category === 'Feedback' ? 'Feedback' : 'Support',
      subject: String(subject).trim(),
      message: String(message).trim()
    });

    res.status(201).json({
      success: true,
      message: 'Ticket submitted successfully. Our team will review it shortly.',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in customer's tickets
 * @route   GET /api/support/tickets
 * @access  Private/Customer
 */
const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ customer: req.user._id }).sort('-createdAt');
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List all tickets (admin)
 * @route   GET /api/admin/support/tickets
 * @access  Private/Admin
 */
const getAllTickets = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const tickets = await Ticket.find(query)
      .populate('customer', 'fullName email phone')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update ticket status (admin)
 * @route   PUT /api/admin/support/tickets/:id
 * @access  Private/Admin
 */
const updateTicketStatus = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    if (status && !['Open', 'Resolved'].includes(status)) {
      res.status(422);
      return next(new Error('Status must be Open or Resolved.'));
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      res.status(404);
      return next(new Error('Ticket not found'));
    }

    if (status) ticket.status = status;
    if (adminNote !== undefined) ticket.adminNote = adminNote;
    await ticket.save();

    res.status(200).json({ success: true, message: 'Ticket updated successfully.', data: ticket });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTicket, getMyTickets, getAllTickets, updateTicketStatus };
