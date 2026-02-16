const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users - list users (for task assignment dropdown; legacy loads after login)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ username: 1 }).lean();
    res.json(users.map((u) => ({ ...u, id: u._id.toString() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
