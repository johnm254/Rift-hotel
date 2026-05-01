const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, isAdmin } = require('../middleware/auth');

// Room statuses: dirty | in-progress | clean | inspected
const VALID_STATUSES = ['dirty', 'in-progress', 'clean', 'inspected'];

// GET /api/housekeeping — get all room housekeeping statuses
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const [roomsSnap, tasksSnap] = await Promise.all([
      db.collection('rooms').get(),
      db.collection('housekeeping').get(),
    ]);

    const tasks = {};
    tasksSnap.docs.forEach(d => { tasks[d.id] = d.data(); });

    const rooms = roomsSnap.docs.map(doc => {
      const room = { id: doc.id, ...doc.data() };
      const task = tasks[doc.id] || {};
      return {
        id: room.id,
        name: room.name,
        available: room.available,
        photo: room.photos?.[0] || null,
        status: task.status || 'clean',
        assignedTo: task.assignedTo || null,
        assignedName: task.assignedName || null,
        notes: task.notes || '',
        updatedAt: task.updatedAt || null,
        updatedBy: task.updatedBy || null,
      };
    });

    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/housekeeping/:roomId — update room status
router.patch('/:roomId', authenticate, async (req, res) => {
  try {
    const { status, notes, assignedTo, assignedName } = req.body;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const update = {
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email,
    };
    if (status) update.status = status;
    if (notes !== undefined) update.notes = notes;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (assignedName !== undefined) update.assignedName = assignedName;

    await db.collection('housekeeping').doc(req.params.roomId).set(update, { merge: true });

    // If room is now clean/inspected, optionally mark it available
    if (status === 'clean' || status === 'inspected') {
      await db.collection('rooms').doc(req.params.roomId).update({ available: true });
    }
    if (status === 'dirty' || status === 'in-progress') {
      await db.collection('rooms').doc(req.params.roomId).update({ available: false });
    }

    res.json({ roomId: req.params.roomId, ...update });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/housekeeping/bulk — mark multiple rooms dirty after checkout
router.post('/bulk', authenticate, isAdmin, async (req, res) => {
  try {
    const { roomIds, status } = req.body;
    if (!roomIds?.length) return res.status(400).json({ error: 'roomIds required' });
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const batch = db.batch();
    roomIds.forEach(id => {
      const ref = db.collection('housekeeping').doc(id);
      batch.set(ref, { status, updatedAt: new Date().toISOString(), updatedBy: req.user.email }, { merge: true });
    });
    await batch.commit();

    res.json({ updated: roomIds.length, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
