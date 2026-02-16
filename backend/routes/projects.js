const express = require('express');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// All project routes require auth (legacy: main panel is after login)
router.use(auth);

// GET /api/projects - list all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: 1 }).lean();
    res.json(projects.map((p) => ({ ...p, id: p._id.toString() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects - create project (legacy: name required)
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    const project = await Project.create({
      name: String(name).trim(),
      description: description != null ? String(description) : ''
    });
    res.status(201).json({
      ...project.toObject(),
      id: project._id.toString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/projects/:id - update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    if (name != null) project.name = String(name).trim();
    if (description != null) project.description = String(description);
    await project.save();
    res.json({ ...project.toObject(), id: project._id.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
