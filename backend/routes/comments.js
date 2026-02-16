const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/comments/task/:taskId - legacy loadComments(taskId)
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    if (!taskId || !mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({ error: 'ID de tarea requerido' });
    }
    const comments = await Comment.find({ taskId })
      .populate('userId', 'username')
      .sort({ createdAt: 1 })
      .lean();
    res.json(comments.map((c) => ({
      ...c,
      id: c._id.toString(),
      taskId: c.taskId.toString(),
      userId: c.userId ? (c.userId._id ? c.userId._id.toString() : c.userId) : null,
      username: c.userId ? (c.userId.username || null) : null
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/comments - legacy addComment (taskId, commentText; userId from auth)
router.post('/', async (req, res) => {
  try {
    const { taskId, commentText } = req.body;
    if (!taskId || !mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({ error: 'ID de tarea requerido' });
    }
    if (!commentText || !String(commentText).trim()) {
      return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    }
    const comment = await Comment.create({
      taskId,
      userId: req.user._id,
      commentText: String(commentText).trim()
    });
    const populated = await Comment.findById(comment._id).populate('userId', 'username').lean();
    const c = populated;
    res.status(201).json({
      ...c,
      id: c._id.toString(),
      taskId: c.taskId.toString(),
      userId: c.userId ? (c.userId._id ? c.userId._id.toString() : c.userId) : null,
      username: c.userId ? c.userId.username : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
