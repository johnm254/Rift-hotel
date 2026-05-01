const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');
const { bookingSchema, paginationSchema, validate } = require('../validators/schemas');
const { sendBookingConfirmation, sendStatusUpdate } = require('../services/email');

// GET /api/bookings/export — admin: export all bookings as CSV
router.get('/export', authenticate, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('bookings').orderBy('createdAt', 'desc').get();
    const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const headers = ['ID', 'Guest Name', 'Email', 'Room', 'Check-in', 'Check-out', 'Guests', 'Total (KES)', 'Status', 'Payment', 'Payment Method', 'Booked At'];
    const rows = bookings.map(b => [
      b.id, b.userName || '', b.userEmail || '', b.roomName || '',
      b.checkIn || '', b.checkOut || '', b.guests || '',
      b.totalPrice || 0, b.status || '', b.paymentStatus || '',
      b.paymentMethod || '', b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bookings-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings/validate-promo — guest: validate promo code
router.post('/validate-promo', authenticate, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });

    const snap = await db.collection('promoCodes').where('code', '==', code.toUpperCase()).get();
    if (snap.empty) return res.status(404).json({ error: 'Invalid promo code' });

    const promo = { id: snap.docs[0].id, ...snap.docs[0].data() };
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return res.status(400).json({ error: 'Promo code has expired' });
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) return res.status(400).json({ error: 'Promo code usage limit reached' });

    res.json({ valid: true, discount: promo.discount, type: promo.type, description: promo.description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings — admin: paginated list
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { limit, cursor } = paginationSchema.parse(req.query);
    let query = db.collection('bookings').orderBy('createdAt', 'desc').limit(limit + 1);
    if (req.query.status) query = query.where('status', '==', req.query.status);
    if (cursor) {
      const cursorDoc = await db.collection('bookings').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }
    const snapshot = await query.get();
    const bookings = snapshot.docs.slice(0, limit).map(d => ({ id: d.id, ...d.data() }));
    res.json({ bookings, nextCursor: snapshot.docs.length > limit ? snapshot.docs[limit - 1].id : null, hasMore: snapshot.docs.length > limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/mine — guest: paginated own bookings
router.get('/mine', authenticate, async (req, res) => {
  try {
    const { limit, cursor } = paginationSchema.parse(req.query);
    let query = db.collection('bookings').where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').limit(limit + 1);
    if (cursor) {
      const cursorDoc = await db.collection('bookings').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }
    const snapshot = await query.get();
    const bookings = snapshot.docs.slice(0, limit).map(d => ({ id: d.id, ...d.data() }));
    res.json({ bookings, nextCursor: snapshot.docs.length > limit ? snapshot.docs[limit - 1].id : null, hasMore: snapshot.docs.length > limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings — guest: create booking with date conflict check
router.post('/', authenticate, validate(bookingSchema), async (req, res) => {
  try {
    const { roomId, roomName, checkIn, checkOut, guests, totalPrice, specialRequests } = req.validated;

    const roomDoc = await db.collection('rooms').doc(roomId).get();
    if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });
    if (!roomDoc.data().available) return res.status(400).json({ error: 'Room not available' });

    // DATE CONFLICT CHECK — prevent double booking
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const conflicting = await db.collection('bookings')
      .where('roomId', '==', roomId)
      .where('status', '==', 'approved')
      .get();

    const hasConflict = conflicting.docs.some(doc => {
      const b = doc.data();
      const bIn = new Date(b.checkIn);
      const bOut = new Date(b.checkOut);
      return checkInDate < bOut && checkOutDate > bIn;
    });

    if (hasConflict) {
      return res.status(409).json({ error: 'This room is already booked for the selected dates. Please choose different dates.' });
    }

    const booking = {
      userId: req.user.uid,
      userEmail: req.user.email,
      userName: req.user.name || req.user.email,
      roomId, roomName, checkIn, checkOut,
      guests, totalPrice,
      specialRequests: specialRequests || '',
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('bookings').add(booking);
    const saved = { id: docRef.id, ...booking };

    // Send confirmation email (async, don't block response)
    sendBookingConfirmation(req.user.email, saved).catch(e => console.warn('Email send failed:', e.message));

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bookings/:id/status — admin: approve/reject/check-out + email
router.patch('/:id/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'checked-out'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved, rejected, or checked-out' });
    }

    const updates = { status, updatedAt: new Date().toISOString(), updatedBy: req.user.email };
    if (status === 'checked-out') {
      updates.checkedOutAt = new Date().toISOString();
      // Award loyalty points: 1 point per KES 100 spent
      const bookingDoc = await db.collection('bookings').doc(req.params.id).get();
      if (bookingDoc.exists) {
        const totalPrice = bookingDoc.data().totalPrice || 0;
        const pointsEarned = Math.floor(totalPrice / 100);
        const userId = bookingDoc.data().userId;
        if (userId && pointsEarned > 0) {
          const userDoc = await db.collection('users').doc(userId).get();
          const currentPoints = userDoc.data()?.loyaltyPoints || 0;
          await db.collection('users').doc(userId).update({
            loyaltyPoints: currentPoints + pointsEarned,
          });
          // Log transaction
          await db.collection('loyaltyTransactions').add({
            userId, bookingId: req.params.id, points: pointsEarned,
            type: 'earned', description: `Stay at ${bookingDoc.data().roomName}`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    await db.collection('bookings').doc(req.params.id).update(updates);

    const doc = await db.collection('bookings').doc(req.params.id).get();
    const booking = { id: doc.id, ...doc.data() };

    // Send status update email (not for check-out)
    if (status !== 'checked-out') {
      sendStatusUpdate(booking.userEmail, booking, status).catch(e => console.warn('Email send failed:', e.message));
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bookings/:id — guest/admin: cancel
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const doc = await db.collection('bookings').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Booking not found' });
    if (doc.data().userId !== req.user.uid && !req.user.admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await db.collection('bookings').doc(req.params.id).delete();
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
