const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');

const VEHICLES = {
  sedan: { name: 'Sedan', capacity: 3, price: 4500, description: 'Toyota Corolla or similar' },
  suv: { name: 'SUV', capacity: 5, price: 6500, description: 'Toyota Prado or similar' },
  van: { name: 'Minivan', capacity: 8, price: 8500, description: 'Toyota HiAce or similar' },
  vip: { name: 'VIP Luxury', capacity: 3, price: 12000, description: 'Mercedes E-Class or similar' },
};

// GET /api/transfers/vehicles — list vehicle options
router.get('/vehicles', (req, res) => {
  res.json({ vehicles: Object.entries(VEHICLES).map(([id, v]) => ({ id, ...v })) });
});

// POST /api/transfers — book a transfer
router.post('/', authenticate, async (req, res) => {
  try {
    const { type, direction, flightNumber, date, time, passengers, bookingId, notes } = req.body;

    if (!type || !VEHICLES[type]) return res.status(400).json({ error: 'Invalid vehicle type' });
    if (!direction || !['pickup', 'dropoff', 'both'].includes(direction)) {
      return res.status(400).json({ error: 'Direction must be pickup, dropoff, or both' });
    }
    if (!date || !time) return res.status(400).json({ error: 'Date and time required' });

    const vehicle = VEHICLES[type];
    const price = direction === 'both' ? vehicle.price * 2 : vehicle.price;

    const transfer = {
      userId: req.user.uid,
      userEmail: req.user.email,
      userName: req.user.name || req.user.email,
      type, direction, flightNumber: flightNumber || '',
      date, time, passengers: passengers || 1,
      bookingId: bookingId || null,
      notes: notes || '',
      vehicle: vehicle.name,
      price,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('transfers').add(transfer);
    res.status(201).json({ id: docRef.id, ...transfer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transfers/mine — guest's transfers
router.get('/mine', authenticate, async (req, res) => {
  try {
    const snap = await db.collection('transfers').where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').get();
    res.json({ transfers: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transfers — admin: all transfers
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const snap = await db.collection('transfers').orderBy('createdAt', 'desc').limit(100).get();
    res.json({ transfers: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
