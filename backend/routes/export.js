const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const statusEnum = ['Pendiente', 'En Progreso', 'Completada', 'Bloqueada', 'Cancelada'];
const priorityEnum = ['Baja', 'Media', 'Alta', 'Crítica'];

function buildTaskFilter(query) {
  const { searchText, status, priority, projectId } = query;
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
  return filter;
}

/** CSV: escape quotes/commas/newlines per RFC 4180 */
function csvEscape(value) {
  const s = value == null ? '' : String(value);
  if (/["\r\n,]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const router = express.Router();
router.use(auth);

// GET /api/export/tasks/csv - legacy exportCSV()
router.get('/tasks/csv', async (req, res) => {
  try {
    const tasks = await Task.find({}).populate('projectId', 'name').populate('assignedTo', 'username').lean();
    const header = 'ID,Título,Descripción,Estado,Prioridad,Proyecto,Asignado,Vencimiento,Horas Estimadas,Horas Reales\n';
    const rows = tasks.map((t) => {
      const projectName = t.projectId ? (t.projectId.name || 'Sin proyecto') : 'Sin proyecto';
      const assignedName = t.assignedTo ? (t.assignedTo.username || 'Sin asignar') : 'Sin asignar';
      return [
        t._id,
        csvEscape(t.title),
        csvEscape(t.description),
        csvEscape(t.status || 'Pendiente'),
        csvEscape(t.priority || 'Media'),
        csvEscape(projectName),
        csvEscape(assignedName),
        csvEscape(t.dueDate || ''),
        t.estimatedHours ?? '',
        t.actualHours ?? ''
      ].join(',');
    });
    const csv = header + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** Handler for GET /api/tasks.csv - same filters as GET /api/tasks, auth required */
async function tasksCsvHandler(req, res) {
  try {
    const filter = buildTaskFilter(req.query);
    const tasks = await Task.find(filter)
      .populate('projectId', 'name')
      .populate('assignedTo', 'username')
      .sort({ createdAt: -1 })
      .lean();
    const header = 'ID,Título,Descripción,Estado,Prioridad,Proyecto,Asignado,Vencimiento,Horas Estimadas,Horas Reales\n';
    const rows = tasks.map((t) => {
      const projectName = t.projectId ? (t.projectId.name || 'Sin proyecto') : 'Sin proyecto';
      const assignedName = t.assignedTo ? (t.assignedTo.username || 'Sin asignar') : 'Sin asignar';
      return [
        t._id,
        csvEscape(t.title),
        csvEscape(t.description),
        csvEscape(t.status || 'Pendiente'),
        csvEscape(t.priority || 'Media'),
        csvEscape(projectName),
        csvEscape(assignedName),
        csvEscape(t.dueDate || ''),
        t.estimatedHours ?? '',
        t.actualHours ?? ''
      ].join(',');
    });
    const csv = header + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = router;
module.exports.tasksCsvHandler = tasksCsvHandler;
