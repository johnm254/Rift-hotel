const express = require('express');
const router = express.Router();
const multer = require('multer');
const { db, storage } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/meals — public: list all meals (optionally by category)
router.get('/', async (req, res) => {
  try {
    let query = db.collection('meals').orderBy('createdAt', 'desc');
    if (req.query.category) {
      query = query.where('category', '==', req.query.category);
    }
    const snapshot = await query.get();
    const meals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/meals/categories — public: list distinct meal categories
router.get('/categories/list', async (req, res) => {
  try {
    const snapshot = await db.collection('meals').get();
    const categories = [...new Set(snapshot.docs.map(doc => doc.data().category).filter(Boolean))];
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/meals/:id — public: single meal
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('meals').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Meal not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meals — admin: create meal with photo
router.post('/', authenticate, isAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { name, description, price, category, dietary } = req.body;
    let photoUrl = '';

    if (req.file) {
      const filename = `meals/${uuidv4()}-${req.file.originalname}`;
      const blob = storage.file(filename);
      await blob.save(req.file.buffer, { contentType: req.file.mimetype });
      await blob.makePublic();
      photoUrl = `https://storage.googleapis.com/${storage.name}/${filename}`;
    }

    const meal = {
      name,
      description,
      price: parseFloat(price),
      category: category || 'main',
      dietary: JSON.parse(dietary || '[]'),
      photo: photoUrl,
      available: true,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('meals').add(meal);
    res.status(201).json({ id: docRef.id, ...meal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/meals/:id — admin: update meal
router.put('/:id', authenticate, isAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { name, description, price, category, dietary, available } = req.body;
    const update = {};

    if (name) update.name = name;
    if (description) update.description = description;
    if (price) update.price = parseFloat(price);
    if (category) update.category = category;
    if (dietary) update.dietary = JSON.parse(dietary);
    if (available !== undefined) update.available = available === 'true';

    if (req.file) {
      const filename = `meals/${uuidv4()}-${req.file.originalname}`;
      const blob = storage.file(filename);
      await blob.save(req.file.buffer, { contentType: req.file.mimetype });
      await blob.makePublic();
      update.photo = `https://storage.googleapis.com/${storage.name}/${filename}`;
    }

    await db.collection('meals').doc(req.params.id).update(update);
    const doc = await db.collection('meals').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/meals/:id — admin: delete meal
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await db.collection('meals').doc(req.params.id).delete();
    res.json({ message: 'Meal deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
