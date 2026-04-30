const express = require('express');
const router = express.Router();
const { db, auth } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const { registerSchema, validate } = require('../validators/schemas');
const { sendWelcomeEmail } = require('../services/email');

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, name } = req.validated;
    const userRecord = await auth.createUser({ email, password, displayName: name });
    await db.collection('users').doc(userRecord.uid).set({ email, name, role: 'guest', createdAt: new Date().toISOString() });
    sendWelcomeEmail(email, name).catch(e => console.warn('Welcome email failed:', e.message));
    res.status(201).json({ uid: userRecord.uid, email: userRecord.email, name: userRecord.displayName });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    res.json({ uid: req.user.uid, email: req.user.email, name: req.user.name || req.user.email, admin: req.user.admin || false, ...userDoc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/me
router.put('/me', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (name) { await auth.updateUser(req.user.uid, { displayName: name }); await db.collection('users').doc(req.user.uid).update({ name }); }
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    res.json({ uid: req.user.uid, ...userDoc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/set-admin
router.post('/set-admin', authenticate, async (req, res) => {
  try {
    const currentUser = await db.collection('users').doc(req.user.uid).get();
    if (currentUser.exists && currentUser.data().role !== 'admin') {
      const adminsSnap = await db.collection('users').where('role', '==', 'admin').get();
      if (!adminsSnap.empty) return res.status(403).json({ error: 'Only admins can grant admin access' });
    }
    const { uid } = req.body;
    await auth.setCustomUserClaims(uid, { admin: true });
    await db.collection('users').doc(uid).update({ role: 'admin' });
    res.json({ message: 'Admin role granted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
