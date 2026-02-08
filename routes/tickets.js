// const express = require('express');
// const router = express.Router();
// const Ticket = require('../models/Ticket');
// const verifyToken = require('../middleware/verifyToken');
// const axios = require('axios');
// const FormData = require('form-data');

// // অ্যাড টিকিট (imgbb আপলোড সহ)
// router.post('/', verifyToken, async (req, res) => {
//   if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Forbidden' });

//   try {
//     const form = new FormData();
//     form.append('image', req.body.image); // base64
//     const uploadRes = await axios.post(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, form, {
//       headers: form.getHeaders()
//     });
//     req.body.image = uploadRes.data.data.url;

//     const ticket = new Ticket(req.body);
//     await ticket.save();
//     res.json(ticket);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // অল অ্যাপ্রুভড টিকিট (সার্চ, ফিল্টার, সর্ট, পেজিনেশন)
// router.get('/', async (req, res) => {
//   const { from, to, type, sort, page = 1, limit = 9 } = req.query;
//   let query = { status: 'approved' };
//   if (from) query.from = from;
//   if (to) query.to = to;
//   if (type) query.type = type;

//   let sortObj = {};
//   if (sort === 'low') sortObj.price = 1;
//   if (sort === 'high') sortObj.price = -1;

//   const tickets = await Ticket.find(query)
//     .sort(sortObj)
//     .skip((page - 1) * limit)
//     .limit(parseInt(limit));

//   res.json(tickets);
// });

// // সিঙ্গেল টিকিট
// router.get('/:id', async (req, res) => {
//   const ticket = await Ticket.findById(req.params.id);
//   if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
//   res.json(ticket);
// });

// // অ্যাপ্রুভ
// router.patch('/:id/approve', verifyToken, async (req, res) => {
//   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
//   const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
//   res.json(ticket);
// });

// // রিজেক্ট
// router.patch('/:id/reject', verifyToken, async (req, res) => {
//   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
//   const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
//   res.json(ticket);
// });

// // অ্যাডভারটাইজ টোগল (ম্যাক্স 6 চেক)
// router.patch('/:id/advertise', verifyToken, async (req, res) => {
//   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
//   const { isAdvertised } = req.body;
//   if (isAdvertised) {
//     const count = await Ticket.countDocuments({ isAdvertised: true });
//     if (count >= 6) return res.status(400).json({ error: 'Maximum 6 advertised tickets' });
//   }
//   const ticket = await Ticket.findByIdAndUpdate(req.params.id, { isAdvertised }, { new: true });
//   res.json(ticket);
// });

// // অ্যাডভারটাইজড টিকিট
// router.get('/advertised', async (req, res) => {
//   const tickets = await Ticket.find({ isAdvertised: true, status: 'approved' }).limit(6);
//   res.json(tickets);
// });

// // লেটেস্ট টিকিট
// router.get('/latest', async (req, res) => {
//   const tickets = await Ticket.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(8);
//   res.json(tickets);
// });

// // ভেন্ডরের মাই টিকিটস
// router.get('/my', verifyToken, async (req, res) => {
//   if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Forbidden' });
//   const tickets = await Ticket.find({ vendorEmail: req.user.email });
//   res.json(tickets);
// });

// // আপডেট টিকিট (ভেন্ডর)
// router.patch('/:id', verifyToken, async (req, res) => {
//   if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Forbidden' });
//   const ticket = await Ticket.findById(req.params.id);
//   if (ticket.vendorEmail !== req.user.email) return res.status(403).json({ error: 'Not your ticket' });
//   const updated = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
//   res.json(updated);
// });

// // ডিলিট টিকিট (ভেন্ডর)
// router.delete('/:id', verifyToken, async (req, res) => {
//   if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Forbidden' });
//   const ticket = await Ticket.findById(req.params.id);
//   if (ticket.vendorEmail !== req.user.email) return res.status(403).json({ error: 'Not your ticket' });
//   await Ticket.findByIdAndDelete(req.params.id);
//   res.json({ message: 'Ticket deleted' });
// });

// // অল টিকিটস (অ্যাডমিনের জন্য)
// router.get('/all', verifyToken, async (req, res) => {
//   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
//   const tickets = await Ticket.find({});
//   res.json(tickets);
// });

// // অ্যাপ্রুভড টিকিটস (অ্যাডভারটাইজ পেজের জন্য)
// router.get('/approved', verifyToken, async (req, res) => {
//   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
//   const tickets = await Ticket.find({ status: 'approved' });
//   res.json(tickets);
// });

// module.exports = router;   



const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const verifyToken = require('../middleware/verifyToken');
const axios = require('axios');
const FormData = require('form-data');

// === POST: Add new ticket (Vendor only) ===
router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Forbidden: Only vendors can add tickets' });
  }

  try {
    // imgbb-তে ইমেজ আপলোড (base64 থেকে)
    const form = new FormData();
    form.append('image', req.body.image); // base64 string

    const uploadRes = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      form,
      { headers: form.getHeaders() }
    );

    if (!uploadRes.data.success) {
      throw new Error('Image upload failed: ' + uploadRes.data.error.message);
    }

    req.body.image = uploadRes.data.data.url;

    const ticket = new Ticket(req.body);
    await ticket.save();

    res.status(201).json(ticket);
  } catch (err) {
    console.error('Add ticket error:', err);
    res.status(500).json({ error: err.message || 'Failed to add ticket' });
  }
});

// === GET: All approved tickets (public, with search/filter/sort/pagination) ===
router.get('/', async (req, res) => {
  try {
    const { from, to, type, sort, page = 1, limit = 9 } = req.query;

    let query = { status: 'approved' };
    if (from) query.from = { $regex: from, $options: 'i' }; // case-insensitive partial match
    if (to) query.to = { $regex: to, $options: 'i' };
    if (type) query.type = type;

    let sortObj = { createdAt: -1 }; // default latest
    if (sort === 'low') sortObj = { price: 1 };
    if (sort === 'high') sortObj = { price: -1 };

    const tickets = await Ticket.find(query)
      .sort(sortObj)
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Ticket.countDocuments(query);

    res.json({
      tickets,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('All tickets error:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// === GET: Advertised tickets (max 6) – public ===
router.get('/advertised', async (req, res) => {
  try {
    const tickets = await Ticket.find({ isAdvertised: true, status: 'approved' })
      .limit(6)
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    console.error('Advertised error:', err);
    res.status(500).json({ error: 'Failed to fetch advertised tickets' });
  }
});

// === GET: Latest tickets (public) ===
router.get('/latest', async (req, res) => {
  try {
    const tickets = await Ticket.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(8);
    res.json(tickets);
  } catch (err) {
    console.error('Latest error:', err);
    res.status(500).json({ error: 'Failed to fetch latest tickets' });
  }
});

// === GET: Vendor's own tickets ===
router.get('/my', verifyToken, async (req, res) => {
  if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Forbidden' });

  try {
    const tickets = await Ticket.find({ vendorEmail: req.user.email });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your tickets' });
  }
});

// === GET: All tickets (Admin only) ===
router.get('/all', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  try {
    const tickets = await Ticket.find({});
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch all tickets' });
  }
});

// === GET: Approved tickets (Admin advertise page) ===
router.get('/approved', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  try {
    const tickets = await Ticket.find({ status: 'approved' });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch approved tickets' });
  }
});

// === GET: Single ticket by ID – MUST BE LAST among GET routes ===
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    console.error('Single ticket error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// === PATCH: Approve ticket (Admin) ===
router.patch('/:id/approve', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true, runValidators: true }
    );
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve ticket' });
  }
});

// === PATCH: Reject ticket (Admin) ===
router.patch('/:id/reject', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject ticket' });
  }
});

// === PATCH: Toggle advertise (Admin, max 6) ===
router.patch('/:id/advertise', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  try {
    const { isAdvertised } = req.body;

    if (isAdvertised) {
      const count = await Ticket.countDocuments({ isAdvertised: true });
      if (count >= 6) {
        return res.status(400).json({ error: 'Maximum 6 advertised tickets allowed' });
      }
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { isAdvertised: !!isAdvertised },
      { new: true }
    );

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update advertise status' });
  }
});

// === PATCH: Update ticket (Vendor only) ===
router.patch('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Forbidden' });

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.vendorEmail !== req.user.email) {
      return res.status(403).json({ error: 'Not your ticket' });
    }

    const updated = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// === DELETE: Delete ticket (Vendor only) ===
router.delete('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Forbidden' });

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.vendorEmail !== req.user.email) {
      return res.status(403).json({ error: 'Not your ticket' });
    }

    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

module.exports = router;