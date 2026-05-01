const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');

// GET /api/packages — public: all active packages
router.get('/', async (req, res) => {
  try {
    const snap = await db.collection('packages').orderBy('createdAt', 'desc').get();
    const packages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Public only sees active ones unless admin
    const filtered = packages.filter(p => p.active !== false);
    res.json({ packages: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/packages/all — admin: all including hidden
router.get('/all', authenticate, isAdmin, async (req, res) => {
  try {
    const snap = await db.collection('packages').orderBy('createdAt', 'desc').get();
    res.json({ packages: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/packages — admin: create
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { title, subtitle, description, tag, roomId, price, originalPrice, includes, image, active } = req.body;
    if (!title || !price) return res.status(400).json({ error: 'Title and price are required' });

    const pkg = {
      title, subtitle: subtitle || '', description: description || '',
      tag: tag || 'Leisure', roomId: roomId || null,
      price: Number(price), originalPrice: originalPrice ? Number(originalPrice) : null,
      includes: Array.isArray(includes) ? includes : [],
      image: image || '', active: active !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('packages').add(pkg);
    res.status(201).json({ id: docRef.id, ...pkg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/packages/:id — admin: update
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const update = { ...req.body, updatedAt: new Date().toISOString() };
    if (update.price) update.price = Number(update.price);
    if (update.originalPrice) update.originalPrice = Number(update.originalPrice);
    await db.collection('packages').doc(req.params.id).update(update);
    const doc = await db.collection('packages').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/packages/:id — admin
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await db.collection('packages').doc(req.params.id).delete();
    res.json({ message: 'Package deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
