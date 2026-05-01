const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');

// GET /api/pricing/rules — admin: get all pricing rules
router.get('/rules', authenticate, isAdmin, async (req, res) => {
  try {
    const snap = await db.collection('pricingRules').orderBy('createdAt', 'desc').get();
    res.json({ rules: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pricing/rules — admin: create rule
router.post('/rules', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, type, value, startDate, endDate, daysOfWeek, roomIds, active } = req.body;
    // type: 'multiplier' (e.g. 1.2 = 20% more) | 'fixed_add' (add KES amount) | 'fixed_set' (override price)
    if (!name || !type || value === undefined) {
      return res.status(400).json({ error: 'name, type, and value are required' });
    }
    const rule = {
      name, type, value: parseFloat(value),
      startDate: startDate || null,
      endDate: endDate || null,
      daysOfWeek: daysOfWeek || [], // [0=Sun,1=Mon,...,6=Sat]
      roomIds: roomIds || [], // empty = applies to all rooms
      active: active !== false,
      createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection('pricingRules').add(rule);
    res.status(201).json({ id: docRef.id, ...rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/pricing/rules/:id — admin: update rule
router.put('/rules/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await db.collection('pricingRules').doc(req.params.id).update({ ...req.body, updatedAt: new Date().toISOString() });
    const doc = await db.collection('pricingRules').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/pricing/rules/:id
router.delete('/rules/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await db.collection('pricingRules').doc(req.params.id).delete();
    res.json({ message: 'Rule deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pricing/calculate — public: calculate price for dates
router.post('/calculate', async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, basePrice } = req.body;
    if (!checkIn || !checkOut || !basePrice) {
      return res.status(400).json({ error: 'checkIn, checkOut, basePrice required' });
    }

    const rulesSnap = await db.collection('pricingRules').where('active', '==', true).get();
    const rules = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    let pricePerNight = parseFloat(basePrice);
    const appliedRules = [];

    for (const rule of rules) {
      // Check room filter
      if (rule.roomIds?.length > 0 && !rule.roomIds.includes(roomId)) continue;

      // Check date range
      if (rule.startDate && new Date(rule.startDate) > checkInDate) continue;
      if (rule.endDate && new Date(rule.endDate) < checkOutDate) continue;

      // Check day of week (applies if ANY night falls on matching day)
      if (rule.daysOfWeek?.length > 0) {
        let matches = false;
        for (let i = 0; i < nights; i++) {
          const d = new Date(checkInDate);
          d.setDate(d.getDate() + i);
          if (rule.daysOfWeek.includes(d.getDay())) { matches = true; break; }
        }
        if (!matches) continue;
      }

      // Apply rule
      if (rule.type === 'multiplier') {
        pricePerNight = pricePerNight * rule.value;
        appliedRules.push({ name: rule.name, effect: `×${rule.value}` });
      } else if (rule.type === 'fixed_add') {
        pricePerNight = pricePerNight + rule.value;
        appliedRules.push({ name: rule.name, effect: `+KES ${rule.value}` });
      } else if (rule.type === 'fixed_set') {
        pricePerNight = rule.value;
        appliedRules.push({ name: rule.name, effect: `Set to KES ${rule.value}` });
      }
    }

    pricePerNight = Math.round(pricePerNight);
    const totalPrice = pricePerNight * nights;

    res.json({
      basePrice: parseFloat(basePrice),
      adjustedPricePerNight: pricePerNight,
      nights,
      totalPrice,
      appliedRules,
      hasDiscount: pricePerNight < parseFloat(basePrice),
      hasSurcharge: pricePerNight > parseFloat(basePrice),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
