const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/export/tasks/csv - legacy exportCSV()
router.get('/tasks/csv', async (req, res) => {
  try {
    const tasks = await Task.find({}).populate('projectId', 'name').lean();
    const header = 'ID,Título,Estado,Prioridad,Proyecto\n';
    const rows = tasks.map((t) => {
      const projectName = t.projectId ? (t.projectId.name || 'Sin proyecto') : 'Sin proyecto';
      const title = (t.title || '').replace(/"/g, '""');
      const status = t.status || 'Pendiente';
      const priority = t.priority || 'Media';
      return `${t._id},"${title}","${status}","${priority}","${projectName}"`;
    });
    const csv = header + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=export_tasks.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
