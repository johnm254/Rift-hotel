const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');

// GET /api/staff — all staff members
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('staff').orderBy('createdAt', 'desc').get();
    const staff = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ staff });
  } catch (err) {
    // Fallback without orderBy if index missing
    try {
      const snapshot = await db.collection('staff').get();
      const staff = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json({ staff });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
});

// POST /api/staff — add a staff member
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, role, department, phone, email, isLeader, notes, avatar } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!department?.trim()) return res.status(400).json({ error: 'Department is required' });

    const member = {
      name: name.trim(),
      role: role?.trim() || department,
      department: department.trim(),
      phone: phone?.trim() || '',
      email: email?.trim() || '',
      isLeader: !!isLeader,
      notes: notes?.trim() || '',
      avatar: avatar?.trim() || '',
      status: 'active',
      assignedTasks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('staff').add(member);
    res.status(201).json({ id: docRef.id, ...member });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/staff/:id — update a staff member
router.patch('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, role, department, phone, email, isLeader, notes, avatar, status } = req.body;
    const update = { updatedAt: new Date().toISOString() };

    if (name !== undefined) update.name = name.trim();
    if (role !== undefined) update.role = role.trim();
    if (department !== undefined) update.department = department.trim();
    if (phone !== undefined) update.phone = phone.trim();
    if (email !== undefined) update.email = email.trim();
    if (isLeader !== undefined) update.isLeader = !!isLeader;
    if (notes !== undefined) update.notes = notes.trim();
    if (avatar !== undefined) update.avatar = avatar.trim();
    if (status !== undefined) update.status = status;

    await db.collection('staff').doc(req.params.id).update(update);
    const doc = await db.collection('staff').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/staff/:id — remove a staff member
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await db.collection('staff').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
