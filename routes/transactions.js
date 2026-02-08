// routes/transactions.js (নতুন ফাইল)
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const verifyToken = require('../middleware/verifyToken');

// ইউজারের সব ট্রানজেকশন
router.get('/', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userEmail: req.user.email });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router;