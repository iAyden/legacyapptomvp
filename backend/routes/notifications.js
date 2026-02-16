const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/notifications - legacy loadNotifications (current user, unread only)
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
      read: false
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json(notifications.map((n) => ({
      ...n,
      id: n._id.toString(),
      userId: n.userId.toString()
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notifications/read - legacy markNotificationsRead (mark all read for current user)
router.put('/read', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id },
      { $set: { read: true } }
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
