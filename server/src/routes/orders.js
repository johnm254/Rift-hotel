
const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');
const { sendOrderNotification, sendOrderReceiptEmail, sendOrderStatusEmail } = require('../services/email');
const { sendNewOrderAlertToOwner, sendOrderReceiptToClient, sendOrderStatusToClient } = require('../services/twilio');
// ── Shared helper: save order + notify owner + notify client ──────────────────
async function createOrder(orderData) {
  const docRef = await db.collection('orders').add(orderData);
  const saved = { id: docRef.id, ...orderData };

  const ownerPhone  = process.env.HOTEL_OWNER_PHONE || '0769113931';
  const adminEmail  = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

  // 1. Email receipt to client (authenticated users have userEmail)
  const clientEmail = saved.userEmail && saved.userEmail !== 'walkin@azurahaven.com'
    ? saved.userEmail : null;
  if (clientEmail) {
    sendOrderReceiptEmail(clientEmail, saved).catch(err =>
      console.error('Client order receipt email failed:', err.message)
    );
  }

  // 2. WhatsApp/SMS receipt to client via Twilio (if phone provided)
  if (saved.clientPhone) {
    sendOrderReceiptToClient(saved.clientPhone, saved).catch(err =>
      console.error('Client Twilio receipt failed:', err.message)
    );
  }

  // 3. Email to admin
  if (adminEmail) {
    sendOrderNotification(adminEmail, saved).catch(err =>
      console.error('Admin order email failed:', err.message)
    );
  }

  // 4. WhatsApp/SMS alert to hotel owner via Twilio
  sendNewOrderAlertToOwner(saved).catch(err =>
    console.error('Owner Twilio alert failed:', err.message)
  );

  return saved;
}

// ── POST /api/orders — authenticated: room service / service request ──────────
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, bookingId, roomNumber, notes, total, type, paymentMethod } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'No items in order' });

    // Look up client's phone from their user profile
    let clientPhone = null;
    try {
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      clientPhone = userDoc.data()?.phone || null;
    } catch { /* no phone on file — skip */ }

    const order = {
      userId: req.user.uid,
      userEmail: req.user.email,
      userName: req.user.name || req.user.email,
      clientPhone,
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
    const { items, roomNumber, notes, total, paymentMethod, tableNo, clientPhone, clientName } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'No items in order' });

    const order = {
      userId: 'walkin',
      userEmail: 'walkin@azurahaven.com',
      userName: clientName || 'Walk-in Guest',
      clientPhone: clientPhone || null,
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

    const { sendWhatsApp, sendOrderStatusWhatsApp } = require('../services/whatsapp');
    const { sendMail } = require('../services/email');
    const ownerPhone = process.env.HOTEL_OWNER_PHONE || '0769113931';

    // Notify owner on key milestones
    if (['on-the-way','delivered','completed'].includes(status)) {
      const statusEmoji = status === 'on-the-way' ? '🚶' : status === 'delivered' ? '✅' : '🎉';
      sendWhatsApp(ownerPhone,
        `${statusEmoji} *Order Update*\n` +
        `Room: *${updated.roomNumber}*\n` +
        `Status: *${status.toUpperCase()}*\n` +
        `${updated.assignedTo ? `Staff: ${updated.assignedTo}\n` : ''}` +
        `Items: ${(updated.items || []).map(i => i.name).join(', ')}`
      ).catch(() => {});
    }

    // Notify client via WhatsApp/SMS (if phone on file)
    if (updated.clientPhone) {
      sendOrderStatusToClient(updated.clientPhone, updated, status).catch(() => {});
    }

    // Notify client via email
    if (updated.userEmail && updated.userEmail !== 'walkin@azurahaven.com') {
      sendOrderStatusEmail(updated.userEmail, updated, status).catch(() => {});
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
