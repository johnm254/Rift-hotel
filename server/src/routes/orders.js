const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');
const { sendOrderNotification } = require('../services/email');

// POST /api/orders — guest: place room service order or service request
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, bookingId, roomNumber, notes, total, type } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'No items in order' });

    const order = {
      userId: req.user.uid,
      userEmail: req.user.email,
      userName: req.user.name || req.user.email,
      items,
      bookingId: bookingId || null,
      roomNumber: roomNumber || 'Unknown',
      notes: notes || '',
      total: total || 0,
      type: type || 'food',
      status: 'received',
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('orders').add(order);
    const savedOrder = { id: docRef.id, ...order };

    // Notify admin via email (non-blocking)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      sendOrderNotification(adminEmail, savedOrder).catch(err =>
        console.error('Order notification email failed:', err.message)
      );
    }

    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders — admin: all orders | guest: their own orders
router.get('/', authenticate, async (req, res) => {
  try {
    let snapshot;
    if (req.user.isAdmin) {
      // Admin sees all orders
      snapshot = await db.collection('orders').orderBy('createdAt', 'desc').limit(200).get();
    } else {
      // Guest sees only their own orders
      snapshot = await db.collection('orders')
        .where('userId', '==', req.user.uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
    }
    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ orders });
  } catch (err) {
    // Fallback without orderBy if index missing
    try {
      const snapshot = await db.collection('orders').get();
      let orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (!req.user.isAdmin) {
        orders = orders.filter(o => o.userId === req.user.uid);
      }
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json({ orders: orders.slice(0, 100) });
    } catch (fallbackErr) {
      res.status(500).json({ error: fallbackErr.message });
    }
  }
});

// GET /api/orders/mine — guest: their own orders (explicit endpoint)
router.get('/mine', authenticate, async (req, res) => {
  try {
    const snapshot = await db.collection('orders')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ orders });
  } catch (err) {
    // Fallback without orderBy
    try {
      const snapshot = await db.collection('orders').where('userId', '==', req.user.uid).get();
      const orders = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json({ orders });
    } catch (fallbackErr) {
      res.status(500).json({ error: fallbackErr.message });
    }
  }
});

// PATCH /api/orders/:id/status — admin: update order status + assignment
router.patch('/:id/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { status, assignedTo, assignNote } = req.body;
    const valid = ['received', 'preparing', 'on-the-way', 'delivered', 'completed', 'cancelled'];
    if (status && !valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const update = { updatedAt: new Date().toISOString() };
    if (status) update.status = status;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (assignNote !== undefined) update.assignNote = assignNote;

    await db.collection('orders').doc(req.params.id).update(update);
    const doc = await db.collection('orders').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
