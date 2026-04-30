const express = require('express');
const router = express.Router();
const { db, auth } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register — create user account
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // Save user profile to Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      role: 'guest',
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName,
    });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const user = {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name || req.user.email,
      admin: req.user.admin || false,
      ...userDoc.data(),
    };
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/me — update user profile
router.put('/me', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (name) {
      await auth.updateUser(req.user.uid, { displayName: name });
      await db.collection('users').doc(req.user.uid).update({ name });
    }
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    res.json({ uid: req.user.uid, ...userDoc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/set-admin — admin: grant admin role to a user
router.post('/set-admin', authenticate, async (req, res) => {
  try {
    // Check if current user is admin
    const currentUser = await db.collection('users').doc(req.user.uid).get();
    if (!currentUser.exists || currentUser.data().role !== 'admin') {
      // Allow the first admin to be set by any authenticated user if no admins exist
      const adminsSnapshot = await db.collection('users').where('role', '==', 'admin').get();
      if (!adminsSnapshot.empty) {
        return res.status(403).json({ error: 'Only admins can grant admin access' });
      }
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
