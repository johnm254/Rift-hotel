const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');

// All routes require admin
router.use(authenticate, isAdmin);

// GET /api/admin/dashboard — stats for admin dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [roomsSnap, mealsSnap, bookingsSnap, usersSnap] = await Promise.all([
      db.collection('rooms').get(),
      db.collection('meals').get(),
      db.collection('bookings').get(),
      db.collection('users').get(),
    ]);

    const bookings = bookingsSnap.docs.map(d => d.data());
    const pending = bookings.filter(b => b.status === 'pending').length;
    const approved = bookings.filter(b => b.status === 'approved').length;

    // Revenue (total from approved bookings)
    const revenue = bookings
      .filter(b => b.status === 'approved')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    res.json({
      rooms: roomsSnap.size,
      meals: mealsSnap.size,
      bookings: bookingsSnap.size,
      pendingBookings: pending,
      approvedBookings: approved,
      totalRevenue: revenue,
      users: usersSnap.size,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users — list all users
router.get('/users', async (req, res) => {
  try {
    const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
