const express = require('express');
const router = express.Router();
const multer = require('multer');
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');
const { mealSchema, paginationSchema, validate } = require('../validators/schemas');
const { optimizeAndUpload } = require('../services/image');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/meals — public: paginated, filterable
router.get('/', async (req, res) => {
  try {
    const { limit, cursor } = paginationSchema.parse(req.query);
    let query = db.collection('meals').orderBy('createdAt', 'desc').limit(limit + 1);
    if (req.query.category) query = query.where('category', '==', req.query.category);
    if (cursor) {
      const cursorDoc = await db.collection('meals').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }
    const snapshot = await query.get();
    const meals = snapshot.docs.slice(0, limit).map(d => ({ id: d.id, ...d.data() }));
    const categoriesSnap = await db.collection('meals').get();
    const categories = [...new Set(categoriesSnap.docs.map(d => d.data().category).filter(Boolean))];
    res.json({ meals, categories, nextCursor: snapshot.docs.length > limit ? snapshot.docs[limit - 1].id : null, hasMore: snapshot.docs.length > limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/meals/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('meals').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Meal not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meals — admin: create with optimized photo
router.post('/', authenticate, isAdmin, upload.single('photo'), validate(mealSchema), async (req, res) => {
  try {
    const { name, description, price, category, dietary } = req.validated;
    let photo = null;
    if (req.file) {
      try {
        const urls = await optimizeAndUpload(req.file.buffer, req.file.originalname, 'meals');
        photo = urls;
      } catch (photoErr) {
        console.warn('Meal photo upload skipped:', photoErr.message);
      }
    }
    const meal = { name, description: description || '', price, category: category || 'main', dietary: dietary || [], photo, available: true, createdAt: new Date().toISOString() };
    const docRef = await db.collection('meals').add(meal);
    res.status(201).json({ id: docRef.id, ...meal });
  } catch (err) {
    console.error('Meal create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/meals/:id — admin
router.put('/:id', authenticate, isAdmin, upload.single('photo'), async (req, res) => {
  try {
    const update = {};
    if (req.body.name) update.name = req.body.name;
    if (req.body.description) update.description = req.body.description;
    if (req.body.price) update.price = parseFloat(req.body.price);
    if (req.body.category) update.category = req.body.category;
    if (req.body.dietary) update.dietary = typeof req.body.dietary === 'string' ? JSON.parse(req.body.dietary) : req.body.dietary;
    if (req.body.available !== undefined) update.available = req.body.available === 'true' || req.body.available === true;
    if (req.file) {
      const urls = await optimizeAndUpload(req.file.buffer, req.file.originalname, 'meals');
      update.photo = urls;
    }
    await db.collection('meals').doc(req.params.id).update(update);
    const doc = await db.collection('meals').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/meals/:id
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await db.collection('meals').doc(req.params.id).delete();
    res.json({ message: 'Meal deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
