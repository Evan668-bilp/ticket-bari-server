const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// JWT টোকেন জেনারেট
router.post('/jwt', (req, res) => {
  const { email } = req.body;
  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// ইউজার সেভ (Firebase থেকে কল হলে)
router.post('/users', async (req, res) => {
  const userData = req.body;
  try {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) return res.json({ message: 'User already exists' });
    const newUser = await User.create(userData);
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;