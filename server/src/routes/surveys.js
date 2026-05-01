const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// POST /api/surveys — submit post-stay survey (public, no auth needed)
router.post('/', async (req, res) => {
  try {
    const { bookingId, ratings, comment } = req.body;
    if (!ratings || typeof ratings !== 'object') {
      return res.status(400).json({ error: 'Ratings required' });
    }

    const avg = Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length;

    const survey = {
      bookingId: bookingId || null,
      ratings,
      avgRating: parseFloat(avg.toFixed(1)),
      comment: comment || '',
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('surveys').add(survey);

    // If linked to a booking, mark it as reviewed
    if (bookingId) {
      await db.collection('bookings').doc(bookingId).update({
        surveySubmitted: true,
        surveyRating: survey.avgRating,
      }).catch(() => {}); // Don't fail if booking not found
    }

    res.status(201).json({ id: docRef.id, ...survey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/surveys — admin: all surveys
router.get('/', async (req, res) => {
  try {
    const snap = await db.collection('surveys').orderBy('createdAt', 'desc').limit(100).get();
    const surveys = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Calculate averages
    const avgOverall = surveys.length
      ? (surveys.reduce((s, sv) => s + (sv.avgRating || 0), 0) / surveys.length).toFixed(1)
      : null;

    res.json({ surveys, avgOverall, total: surveys.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
