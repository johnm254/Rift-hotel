const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');
const { bookingSchema, paginationSchema, validate } = require('../validators/schemas');
const { sendBookingConfirmation, sendStatusUpdate } = require('../services/email');

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

// PATCH /api/bookings/:id/status — admin: approve/reject + email
router.patch('/:id/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    await db.collection('bookings').doc(req.params.id).update({
      status, updatedAt: new Date().toISOString(), updatedBy: req.user.email,
    });

    const doc = await db.collection('bookings').doc(req.params.id).get();
    const booking = { id: doc.id, ...doc.data() };

    // Send status update email
    sendStatusUpdate(booking.userEmail, booking, status).catch(e => console.warn('Email send failed:', e.message));

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
