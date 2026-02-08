const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const Ticket = require('../models/Ticket');
const verifyToken = require('../middleware/verifyToken');

// পেমেন্ট ইনটেন্ট ক্রিয়েট
router.post('/create-payment-intent', verifyToken, async (req, res) => {
  const { bookingId } = req.body;
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.userEmail !== req.user.email || booking.status !== 'accepted') {
      return res.status(400).json({ error: 'Invalid booking' });
    }
    const ticket = await Ticket.findById(booking.ticketId);
    if (new Date(ticket.departure) < new Date()) return res.status(400).json({ error: 'Expired' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.totalPrice * 100,
      currency: 'usd',
      metadata: { bookingId: booking._id.toString() }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ওয়েবহুক (পেমেন্ট সাকসেস হলে অটো আপডেট)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = 'your_stripe_webhook_secret'; // Stripe ড্যাশবোর্ড থেকে নাও

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata.bookingId;
    const booking = await Booking.findById(bookingId);
    booking.status = 'paid';
    await booking.save();

    await Ticket.findByIdAndUpdate(booking.ticketId, { $inc: { quantity: -booking.quantity } });

    await Transaction.create({
      transactionId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      ticketTitle: booking.ticketTitle,
      userEmail: booking.userEmail,
      date: new Date()
    });
  }

  res.json({ received: true });
});

// ইউজারের ট্রানজেকশনস
router.get('/transactions', verifyToken, async (req, res) => {
  const transactions = await Transaction.find({ userEmail: req.user.email });
  res.json(transactions);
});

// ভেন্ডরের রেভেনিউ (চ্যালেঞ্জের জন্য অতিরিক্ত)
router.get('/revenue', verifyToken, async (req, res) => {
  if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Forbidden' });
  const bookings = await Booking.find({ status: 'paid' }).populate('ticketId');
  const vendorBookings = bookings.filter(b => b.ticketId.vendorEmail === req.user.email);
  const totalRevenue = vendorBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalSold = vendorBookings.reduce((sum, b) => sum + b.quantity, 0);
  const totalAdded = await Ticket.countDocuments({ vendorEmail: req.user.email });
  res.json({ totalRevenue, totalSold, totalAdded });
});

module.exports = router;