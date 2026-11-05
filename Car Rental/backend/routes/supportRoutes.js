const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createTicket, getMyTickets } = require('../controllers/ticketController');

router.route('/tickets')
  .post(protect, createTicket)
  .get(protect, getMyTickets);

module.exports = router;
