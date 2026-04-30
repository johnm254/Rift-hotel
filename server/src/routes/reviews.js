const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const { reviewSchema, paginationSchema, validate } = require('../validators/schemas');

// POST /api/reviews — guest: submit review
router.post('/', authenticate, validate(reviewSchema), async (req, res) => {
  try {
    const { roomId, rating, comment } = req.validated;
    const roomDoc = await db.collection('rooms').doc(roomId).get();
    if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });

    // Check user already reviewed this room
    const existing = await db.collection('reviews').where('roomId', '==', roomId).where('userId', '==', req.user.uid).get();
    if (!existing.empty) return res.status(409).json({ error: 'You already reviewed this room' });

    const review = { roomId, userId: req.user.uid, userName: req.user.name || req.user.email, rating, comment: comment || '', createdAt: new Date().toISOString() };
    const docRef = await db.collection('reviews').add(review);

    // Update room average rating
    const allReviews = await db.collection('reviews').where('roomId', '==', roomId).get();
    const avg = (allReviews.docs.reduce((s, d) => s + d.data().rating, 0) / allReviews.size).toFixed(1);
    await db.collection('rooms').doc(roomId).update({ avgRating: parseFloat(avg), reviewCount: allReviews.size });

    res.status(201).json({ id: docRef.id, ...review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/:roomId — public: paginated reviews for a room
router.get('/:roomId', async (req, res) => {
  try {
    const { limit, cursor } = paginationSchema.parse(req.query);
    let query = db.collection('reviews').where('roomId', '==', req.params.roomId).orderBy('createdAt', 'desc').limit(limit + 1);
    if (cursor) { const cd = await db.collection('reviews').doc(cursor).get(); if (cd.exists) query = query.startAfter(cd); }
    const snapshot = await query.get();
    const reviews = snapshot.docs.slice(0, limit).map(d => ({ id: d.id, ...d.data() }));
    res.json({ reviews, nextCursor: snapshot.docs.length > limit ? snapshot.docs[limit - 1].id : null, hasMore: snapshot.docs.length > limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
