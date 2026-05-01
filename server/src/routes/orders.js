const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');

// POST /api/orders — guest: place room service order
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, bookingId, roomNumber, notes, total } = req.body;
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
      status: 'received',
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('orders').add(order);
    res.status(201).json({ id: docRef.id, ...order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders — admin: all orders
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').limit(100).get();
    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status — admin: update order status
router.patch('/:id/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['received', 'preparing', 'on-the-way', 'delivered'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await db.collection('orders').doc(req.params.id).update({ status, updatedAt: new Date().toISOString() });
    const doc = await db.collection('orders').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
