const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');

// GET /api/bookings — admin: list all bookings (optional filter by status)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    let query = db.collection('bookings').orderBy('createdAt', 'desc');
    if (req.query.status) {
      query = query.where('status', '==', req.query.status);
    }
    const snapshot = await query.get();
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/mine — guest: list own bookings
router.get('/mine', authenticate, async (req, res) => {
  try {
    const snapshot = await db.collection('bookings')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings — guest: create booking
router.post('/', authenticate, async (req, res) => {
  try {
    const { roomId, roomName, checkIn, checkOut, guests, totalPrice, specialRequests } = req.body;

    // Verify room exists and is available
    const roomDoc = await db.collection('rooms').doc(roomId).get();
    if (!roomDoc.exists) {
      return res.status(404).json({ error: 'Room not found' });
    }
    if (!roomDoc.data().available) {
      return res.status(400).json({ error: 'Room not available' });
    }

    const booking = {
      userId: req.user.uid,
      userEmail: req.user.email,
      userName: req.user.name || req.user.email,
      roomId,
      roomName,
      checkIn,
      checkOut,
      guests: parseInt(guests),
      totalPrice: parseFloat(totalPrice),
      specialRequests: specialRequests || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('bookings').add(booking);
    res.status(201).json({ id: docRef.id, ...booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bookings/:id/status — admin: approve/reject booking
router.patch('/:id/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    await db.collection('bookings').doc(req.params.id).update({
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email,
    });

    const doc = await db.collection('bookings').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bookings/:id — guest: cancel own booking (or admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const doc = await db.collection('bookings').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Booking not found' });

    // Only the booking owner or admin can cancel
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
