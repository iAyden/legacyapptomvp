const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/reports/tasks - legacy generateReport('tasks')
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({}).lean();
    const statusCount = {};
    tasks.forEach((task) => {
      const status = task.status || 'Pendiente';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    const lines = Object.entries(statusCount).map(([status, count]) => `${status}: ${count} tareas`);
    const text = `=== REPORTE: TASKS ===\n\n${lines.join('\n')}\n`;
    res.json({ report: text, type: 'tasks' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/projects - legacy generateReport('projects')
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find({}).lean();
    const tasks = await Task.find({}).lean();
    const lines = projects.map((p) => {
      const count = tasks.filter((t) => t.projectId && t.projectId.toString() === p._id.toString()).length;
      return `${p.name}: ${count} tareas`;
    });
    const text = `=== REPORTE: PROJECTS ===\n\n${lines.join('\n')}\n`;
    res.json({ report: text, type: 'projects' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/users - legacy generateReport('users')
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('username').lean();
    const tasks = await Task.find({}).lean();
    const lines = users.map((u) => {
      const count = tasks.filter((t) => t.assignedTo && t.assignedTo.toString() === u._id.toString()).length;
      return `${u.username}: ${count} tareas asignadas`;
    });
    const text = `=== REPORTE: USERS ===\n\n${lines.join('\n')}\n`;
    res.json({ report: text, type: 'users' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
