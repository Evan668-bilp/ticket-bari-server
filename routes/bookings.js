const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const verifyToken = require('../middleware/verifyToken');

// বুকিং ক্রিয়েট
router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ error: 'Forbidden' });
  const ticket = await Ticket.findById(req.body.ticketId);
  if (!ticket || ticket.quantity < req.body.quantity) return res.status(400).json({ error: 'Invalid quantity' });
  if (new Date(ticket.departure) < new Date()) return res.status(400).json({ error: 'Expired' });

  const booking = new Booking({
    ...req.body,
    ticketTitle: ticket.title,
    from: ticket.from,
    to: ticket.to,
    departure: ticket.departure
  });
  await booking.save();
  res.json(booking);
});

// ইউজারের মাই বুকিংস

// router.get('/my', verifyToken, async (req, res) => {
//   if (req.user.role !== 'user') return res.status(403).json({ error: 'Forbidden' });
//   const bookings = await Booking.find({ userEmail: req.user.email });
//   res.json(bookings);
// });

router.get('/my', verifyToken, async (req, res) => {
  const bookings = await Booking.find({ userId: req.user.id });
  res.json(bookings);
});




// ভেন্ডরের রিকোয়েস্টেড বুকিংস
router.get('/requested', verifyToken, async (req, res) => {
  if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Forbidden' });
  const bookings = await Booking.find({ status: 'pending' }).populate('ticketId', 'vendorEmail');
  const vendorBookings = bookings.filter(b => b.ticketId.vendorEmail === req.user.email);
  res.json(vendorBookings);
});

// অ্যাকসেপ্ট
router.patch('/:id/accept', verifyToken, async (req, res) => {
  if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Forbidden' });
  const booking = await Booking.findById(req.params.id).populate('ticketId');
  if (booking.ticketId.vendorEmail !== req.user.email) return res.status(403).json({ error: 'Not your ticket' });
  booking.status = 'accepted';
  await booking.save();
  res.json(booking);
});

// রিজেক্ট
router.patch('/:id/reject', verifyToken, async (req, res) => {
  if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Forbidden' });
  const booking = await Booking.findById(req.params.id).populate('ticketId');
  if (booking.ticketId.vendorEmail !== req.user.email) return res.status(403).json({ error: 'Not your ticket' });
  booking.status = 'rejected';
  await booking.save();
  res.json(booking);
});

module.exports = router;