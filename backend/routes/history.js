const express = require('express');
const mongoose = require('mongoose');
const History = require('../models/History');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/history/task/:taskId - legacy loadHistory(taskId)
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    if (!taskId || !mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({ error: 'ID de tarea requerido' });
    }
    const entries = await History.find({ taskId })
      .populate('userId', 'username')
      .sort({ timestamp: 1 })
      .lean();
    res.json(entries.map((e) => ({
      ...e,
      id: e._id.toString(),
      taskId: e.taskId.toString(),
      userId: e.userId ? (e.userId._id ? e.userId._id.toString() : e.userId) : null,
      username: e.userId ? e.userId.username : null
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/history - legacy loadAllHistory (last 100, newest first)
router.get('/', async (req, res) => {
  try {
    const entries = await History.find({})
      .populate('userId', 'username')
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();
    res.json(entries.map((e) => ({
      ...e,
      id: e._id.toString(),
      taskId: e.taskId.toString(),
      userId: e.userId ? (e.userId._id ? e.userId._id.toString() : e.userId) : null,
      username: e.userId ? e.userId.username : null
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
