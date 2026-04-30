const express = require('express');
const router = express.Router();
const multer = require('multer');
const { db, storage } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/rooms — public: list all rooms
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('rooms').orderBy('createdAt', 'desc').get();
    const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rooms/:id — public: single room
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('rooms').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Room not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms — admin: create room with photos
router.post('/', authenticate, isAdmin, upload.array('photos', 10), async (req, res) => {
  try {
    const { name, description, price, capacity, amenities } = req.body;
    const photoUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filename = `rooms/${uuidv4()}-${file.originalname}`;
        const blob = storage.file(filename);
        await blob.save(file.buffer, { contentType: file.mimetype });
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${storage.name}/${filename}`;
        photoUrls.push(publicUrl);
      }
    }

    const room = {
      name,
      description,
      price: parseFloat(price),
      capacity: parseInt(capacity),
      amenities: JSON.parse(amenities || '[]'),
      photos: photoUrls,
      available: true,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('rooms').add(room);
    res.status(201).json({ id: docRef.id, ...room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/rooms/:id — admin: update room
router.put('/:id', authenticate, isAdmin, upload.array('photos', 10), async (req, res) => {
  try {
    const { name, description, price, capacity, amenities, available } = req.body;
    const update = {};

    if (name) update.name = name;
    if (description) update.description = description;
    if (price) update.price = parseFloat(price);
    if (capacity) update.capacity = parseInt(capacity);
    if (amenities) update.amenities = JSON.parse(amenities);
    if (available !== undefined) update.available = available === 'true';

    if (req.files && req.files.length > 0) {
      const photoUrls = [];
      for (const file of req.files) {
        const filename = `rooms/${uuidv4()}-${file.originalname}`;
        const blob = storage.file(filename);
        await blob.save(file.buffer, { contentType: file.mimetype });
        await blob.makePublic();
        photoUrls.push(`https://storage.googleapis.com/${storage.name}/${filename}`);
      }
      update.photos = photoUrls;
    }

    await db.collection('rooms').doc(req.params.id).update(update);
    const doc = await db.collection('rooms').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rooms/:id — admin: delete room
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await db.collection('rooms').doc(req.params.id).delete();
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
