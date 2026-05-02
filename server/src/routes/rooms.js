const express = require('express');
const router = express.Router();
const multer = require('multer');
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');
const { roomSchema, paginationSchema, validate } = require('../validators/schemas');
const { optimizeAndUpload } = require('../services/image');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/rooms — public: paginated list
router.get('/', async (req, res) => {
  try {
    const { limit, cursor } = paginationSchema.parse(req.query);
    let rooms = [];
    try {
      let query = db.collection('rooms').orderBy('createdAt', 'desc').limit(limit + 1);
      if (cursor) {
        const cursorDoc = await db.collection('rooms').doc(cursor).get();
        if (cursorDoc.exists) query = query.startAfter(cursorDoc);
      }
      const snapshot = await query.get();
      rooms = snapshot.docs.slice(0, limit).map(doc => ({ id: doc.id, ...doc.data() }));
      const hasMore = snapshot.docs.length > limit;
      const nextCursor = hasMore ? snapshot.docs[limit - 1].id : null;
      return res.json({ rooms, nextCursor, hasMore });
    } catch {
      // Fallback: fetch without ordering if index missing
      const snapshot = await db.collection('rooms').limit(limit).get();
      rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ rooms, nextCursor: null, hasMore: false });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rooms/:id — public: single room with reviews
router.get('/:id', async (req, res) => {
  try {
    const roomDoc = await db.collection('rooms').doc(req.params.id).get();
    if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });

    // Fetch reviews — handle missing index gracefully
    let reviews = [];
    try {
      const reviewsSnap = await db.collection('reviews')
        .where('roomId', '==', req.params.id)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
      reviews = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      // Index not ready — fetch without ordering
      try {
        const reviewsSnap = await db.collection('reviews')
          .where('roomId', '==', req.params.id)
          .limit(20)
          .get();
        reviews = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch { reviews = []; }
    }

    const avgRating = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.json({ id: roomDoc.id, ...roomDoc.data(), reviews, avgRating, reviewCount: reviews.length });
  } catch (err) {
    console.error('Room fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms — admin: create room with optimized photos
router.post('/', authenticate, isAdmin, upload.array('photos', 10), validate(roomSchema), async (req, res) => {
  try {
    const { name, description, price, capacity, amenities, tourUrl } = req.validated;
    const photoAssets = [];

    if (req.files?.length) {
      for (const file of req.files) {
        try {
          const urls = await optimizeAndUpload(file.buffer, file.originalname, 'rooms');
          if (urls) photoAssets.push(urls);
        } catch (photoErr) {
          console.warn('Photo upload skipped:', photoErr.message);
        }
      }
    }

    const room = {
      name,
      description: description || '',
      price,
      capacity,
      amenities: amenities || [],
      photos: photoAssets,
      tourUrl: tourUrl || '',
      available: true,
      createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection('rooms').add(room);
    res.status(201).json({ id: docRef.id, ...room });
  } catch (err) {
    console.error('Room create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/rooms/:id — admin: update room
router.put('/:id', authenticate, isAdmin, upload.array('photos', 10), async (req, res) => {
  try {
    const update = {};
    if (req.body.name) update.name = req.body.name;
    if (req.body.description) update.description = req.body.description;
    if (req.body.price) update.price = parseFloat(req.body.price);
    if (req.body.capacity) update.capacity = parseInt(req.body.capacity);
    if (req.body.amenities) update.amenities = typeof req.body.amenities === 'string' ? JSON.parse(req.body.amenities) : req.body.amenities;
    if (req.body.available !== undefined) update.available = req.body.available === 'true' || req.body.available === true;

    if (req.files?.length) {
      const photoAssets = [];
      for (const file of req.files) {
        const urls = await optimizeAndUpload(file.buffer, file.originalname, 'rooms');
        photoAssets.push(urls);
      }
      update.photos = photoAssets;
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
