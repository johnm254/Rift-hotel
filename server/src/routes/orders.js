
const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');
const { sendOrderNotification } = require('../services/email');
const { sendOrderWhatsApp } = require('../services/whatsapp');

// ── Shared helper: save order + notify owner ──────────────────────────────────
async function createOrder(orderData) {
  const docRef = await db.collection('orders').add(orderData);
  const saved = { id: docRef.id, ...orderData };

  const ownerPhone = process.env.HOTEL_OWNER_PHONE || '0769113931';

  // WhatsApp to hotel owner — non-blocking
  sendOrderWhatsApp(ownerPhone, saved).catch(err =>
    console.error('Order WhatsApp failed:', err.message)
  );

  // Email to admin — non-blocking
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (adminEmail) {
    sendOrderNotification(adminEmail, saved).catch(err =>
      console.error('Order email failed:', err.message)
    );
  }

  return saved;
}

// ── POST /api/orders — authenticated: room service / service request ──────────
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, bookingId, roomNumber, notes, total, type, paymentMethod } = req.body;
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
      paymentMethod: paymentMethod || null,
      status: 'received',
      createdAt: new Date().toISOString(),
    };

    const saved = await createOrder(order);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/orders/walkin — public: walk-in restaurant order (no auth) ──────
router.post('/walkin', async (req, res) => {
  try {
    const { items, roomNumber, notes, total, paymentMethod, tableNo } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'No items in order' });

    const order = {
      userId: 'walkin',
      userEmail: 'walkin@azurahaven.com',
      userName: 'Walk-in Guest',
      items,
      bookingId: null,
      roomNumber: tableNo || roomNumber || 'Walk-in',
      notes: notes || '',
      total: total || 0,
      type: 'walkin',
      paymentMethod: paymentMethod || 'cash',
      status: 'received',
      createdAt: new Date().toISOString(),
    };

    const saved = await createOrder(order);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/orders — admin: all | guest: own orders ─────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    let snapshot;
    if (req.user.isAdmin) {
      snapshot = await db.collection('orders').orderBy('createdAt', 'desc').limit(200).get();
    } else {
      snapshot = await db.collection('orders')
        .where('userId', '==', req.user.uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
    }
    res.json({ orders: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    // Fallback without orderBy if Firestore index missing
    try {
      const snapshot = await db.collection('orders').get();
      let orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (!req.user.isAdmin) orders = orders.filter(o => o.userId === req.user.uid);
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json({ orders: orders.slice(0, 100) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
});

// ── GET /api/orders/mine — guest: own orders ──────────────────────────────────
router.get('/mine', authenticate, async (req, res) => {
  try {
    const snapshot = await db.collection('orders')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    res.json({ orders: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    try {
      const snapshot = await db.collection('orders').where('userId', '==', req.user.uid).get();
      const orders = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json({ orders });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
});

// ── PATCH /api/orders/:id/status — admin: update status + assignment ──────────
router.patch('/:id/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { status, assignedTo, assignNote } = req.body;
    const valid = ['received','preparing','on-the-way','delivered','completed','cancelled'];
    if (status && !valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const update = { updatedAt: new Date().toISOString() };
    if (status) update.status = status;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (assignNote !== undefined) update.assignNote = assignNote;

    await db.collection('orders').doc(req.params.id).update(update);
    const doc = await db.collection('orders').doc(req.params.id).get();
    const updated = { id: doc.id, ...doc.data() };

    // Notify owner when status changes to key milestones
    if (['on-the-way','delivered','completed'].includes(status)) {
      const ownerPhone = process.env.HOTEL_OWNER_PHONE || '0769113931';
      const statusEmoji = status === 'on-the-way' ? '🚶' : status === 'delivered' ? '✅' : '🎉';
      const { sendWhatsApp } = require('../services/whatsapp');
      sendWhatsApp(ownerPhone,
        `${statusEmoji} *Order Update*\n` +
        `Room: *${updated.roomNumber}*\n` +
        `Status: *${status.toUpperCase()}*\n` +
        `${updated.assignedTo ? `Staff: ${updated.assignedTo}\n` : ''}` +
        `Items: ${(updated.items || []).map(i => i.name).join(', ')}`
      ).catch(() => {});
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
