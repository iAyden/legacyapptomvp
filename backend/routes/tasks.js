const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const History = require('../models/History');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const statusEnum = ['Pendiente', 'En Progreso', 'Completada', 'Bloqueada', 'Cancelada'];
const priorityEnum = ['Baja', 'Media', 'Alta', 'Crítica'];

// GET /api/tasks - list tasks with optional filters (legacy search: searchText, status, priority, projectId)
router.get('/', async (req, res) => {
  try {
    const { searchText, status, priority, projectId } = req.query;
    const filter = {};

    if (status && statusEnum.includes(status)) filter.status = status;
    if (priority && priorityEnum.includes(priority)) filter.priority = priority;
    if (projectId && mongoose.isValidObjectId(projectId)) filter.projectId = projectId;
    if (searchText && String(searchText).trim()) {
      const text = String(searchText).trim().toLowerCase();
      filter.$or = [
        { title: { $regex: text, $options: 'i' } },
        { description: { $regex: text, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(filter)
      .populate('projectId', 'name')
      .populate('assignedTo', 'username')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    res.json(tasks.map((t) => ({
      ...t,
      id: t._id.toString(),
      projectId: t.projectId ? (t.projectId._id ? t.projectId._id.toString() : t.projectId) : null,
      assignedTo: t.assignedTo ? (t.assignedTo._id ? t.assignedTo._id.toString() : t.assignedTo) : null,
      createdBy: t.createdBy ? (t.createdBy._id ? t.createdBy._id.toString() : t.createdBy) : null
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tasks/stats - legacy updateStats()
router.get('/stats', async (req, res) => {
  try {
    const tasks = await Task.find({}).lean();
    let total = tasks.length;
    let completed = 0;
    let pending = 0;
    let highPriority = 0;
    let overdue = 0;
    const now = new Date();

    tasks.forEach((task) => {
      if (task.status === 'Completada') completed++;
      else pending++;
      if (task.priority === 'Alta' || task.priority === 'Crítica') highPriority++;
      if (task.dueDate && task.status !== 'Completada') {
        const due = new Date(task.dueDate);
        if (!isNaN(due.getTime()) && due < now) overdue++;
      }
    });

    res.json({
      total,
      completed,
      pending,
      highPriority,
      overdue,
      statsText: `Total: ${total} | Completadas: ${completed} | Pendientes: ${pending} | Alta Prioridad: ${highPriority} | Vencidas: ${overdue}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tasks/:id - single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('projectId', 'name')
      .populate('assignedTo', 'username')
      .populate('createdBy', 'username');
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
    const o = task.toObject();
    res.json({
      ...o,
      id: o._id.toString(),
      projectId: o.projectId ? (o.projectId._id ? o.projectId._id.toString() : o.projectId) : null,
      assignedTo: o.assignedTo ? (o.assignedTo._id ? o.assignedTo._id.toString() : o.assignedTo) : null,
      createdBy: o.createdBy ? (o.createdBy._id ? o.createdBy._id.toString() : o.createdBy) : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tasks - create task (legacy: title required, createdBy = currentUser)
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      projectId,
      assignedTo,
      dueDate,
      estimatedHours
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'El título es requerido' });
    }

    const task = await Task.create({
      title: String(title).trim(),
      description: description != null ? String(description) : '',
      status: status && statusEnum.includes(status) ? status : 'Pendiente',
      priority: priority && priorityEnum.includes(priority) ? priority : 'Media',
      projectId: projectId && mongoose.isValidObjectId(projectId) ? projectId : null,
      assignedTo: assignedTo && mongoose.isValidObjectId(assignedTo) ? assignedTo : null,
      dueDate: dueDate != null ? String(dueDate) : '',
      estimatedHours: typeof estimatedHours === 'number' ? estimatedHours : parseFloat(estimatedHours) || 0,
      actualHours: 0,
      createdBy: req.user._id
    });

    await History.create({
      taskId: task._id,
      userId: req.user._id,
      action: 'CREATED',
      oldValue: '',
      newValue: task.title
    });

    if (task.assignedTo) {
      await Notification.create({
        userId: task.assignedTo,
        message: 'Nueva tarea asignada: ' + task.title,
        type: 'task_assigned'
      });
    }

    const populated = await Task.findById(task._id)
      .populate('projectId', 'name')
      .populate('assignedTo', 'username')
      .populate('createdBy', 'username');
    const o = populated.toObject();
    res.status(201).json({
      ...o,
      id: o._id.toString(),
      projectId: o.projectId ? (o.projectId._id ? o.projectId._id.toString() : o.projectId) : null,
      assignedTo: o.assignedTo ? (o.assignedTo._id ? o.assignedTo._id.toString() : o.assignedTo) : null,
      createdBy: o.createdBy ? (o.createdBy._id ? o.createdBy._id.toString() : o.createdBy) : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/tasks/:id - update task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    const {
      title,
      description,
      status,
      priority,
      projectId,
      assignedTo,
      dueDate,
      estimatedHours
    } = req.body;

    if (title != null && !String(title).trim()) {
      return res.status(400).json({ error: 'El título es requerido' });
    }

    const oldStatus = task.status;
    const oldTitle = task.title;

    if (title != null) task.title = String(title).trim();
    if (description != null) task.description = String(description);
    if (status != null && statusEnum.includes(status)) task.status = status;
    if (priority != null && priorityEnum.includes(priority)) task.priority = priority;
    if (projectId !== undefined) task.projectId = projectId && mongoose.isValidObjectId(projectId) ? projectId : null;
    if (assignedTo !== undefined) task.assignedTo = assignedTo && mongoose.isValidObjectId(assignedTo) ? assignedTo : null;
    if (dueDate !== undefined) task.dueDate = String(dueDate);
    if (estimatedHours !== undefined) task.estimatedHours = typeof estimatedHours === 'number' ? estimatedHours : parseFloat(estimatedHours) || 0;

    await task.save();

    if (oldStatus !== task.status) {
      await History.create({
        taskId: task._id,
        userId: req.user._id,
        action: 'STATUS_CHANGED',
        oldValue: oldStatus,
        newValue: task.status
      });
    }
    if (oldTitle !== task.title) {
      await History.create({
        taskId: task._id,
        userId: req.user._id,
        action: 'TITLE_CHANGED',
        oldValue: oldTitle,
        newValue: task.title
      });
    }

    if (task.assignedTo) {
      await Notification.create({
        userId: task.assignedTo,
        message: 'Tarea actualizada: ' + task.title,
        type: 'task_updated'
      });
    }

    const populated = await Task.findById(task._id)
      .populate('projectId', 'name')
      .populate('assignedTo', 'username')
      .populate('createdBy', 'username');
    const o = populated.toObject();
    res.json({
      ...o,
      id: o._id.toString(),
      projectId: o.projectId ? (o.projectId._id ? o.projectId._id.toString() : o.projectId) : null,
      assignedTo: o.assignedTo ? (o.assignedTo._id ? o.assignedTo._id.toString() : o.assignedTo) : null,
      createdBy: o.createdBy ? (o.createdBy._id ? o.createdBy._id.toString() : o.createdBy) : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    await History.create({
      taskId: task._id,
      userId: req.user._id,
      action: 'DELETED',
      oldValue: task.title,
      newValue: ''
    });

    await Task.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
