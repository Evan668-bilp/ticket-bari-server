const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const verifyToken = require('../middleware/verifyToken');

// ইউজারের প্রোফাইল (me)

// router.get('/me', verifyToken, async (req, res) => {
//   const user = await User.findOne({ email: req.user.email });
//   res.json(user);
// });

router.get('/me', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});



// অল ইউজার (অ্যাডমিন)
router.get('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const users = await User.find({});
  res.json(users);
});

// রোল চেঞ্জ
router.patch('/:id/role', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { role } = req.body;
  const updatedUser = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  res.json(updatedUser);
});

// ফ্রড মার্ক (ভেন্ডরকে)
router.patch('/:id/fraud', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const user = await User.findById(req.params.id);
  if (user.role !== 'vendor') return res.status(400).json({ error: 'Not a vendor' });
  user.isFraud = true;
  await user.save();
  // ভেন্ডরের টিকিট হাইড
  await Ticket.updateMany({ vendorEmail: user.email }, { status: 'rejected' });
  res.json(user);
});

module.exports = router;