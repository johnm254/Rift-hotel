const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');

// GET /api/properties — public: active properties
router.get('/', async (req, res) => {
  try {
    const snap = await db.collection('properties').where('active', '==', true).get();
    res.json({ properties: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/properties/all — admin: all including inactive
router.get('/all', authenticate, isAdmin, async (req, res) => {
  try {
    const snap = await db.collection('properties').orderBy('createdAt', 'desc').get();
    res.json({ properties: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/properties — admin: create
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, location, description, phone, email, website, currency, timezone, active } = req.body;
    if (!name || !location) return res.status(400).json({ error: 'Name and location required' });
    const property = {
      name, location, description: description || '', phone: phone || '',
      email: email || '', website: website || '',
      currency: currency || 'KES', timezone: timezone || 'Africa/Nairobi',
      active: active !== false, createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection('properties').add(property);
    res.status(201).json({ id: docRef.id, ...property });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/properties/:id — admin: update
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await db.collection('properties').doc(req.params.id).update({ ...req.body, updatedAt: new Date().toISOString() });
    const doc = await db.collection('properties').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/properties/:id — admin
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await db.collection('properties').doc(req.params.id).delete();
    res.json({ message: 'Property deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
