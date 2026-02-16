/**
 * One-time migration: import legacy localStorage JSON dump into MongoDB.
 * Does NOT run automatically. Run manually: node scripts/migrateFromLocalStorageDump.js <path-to-dump.json>
 *
 * Expected JSON shape (keys from legacy Storage.init / get*):
 * {
 *   "users": [ { "id": 1, "username": "...", "password": "..." } ],
 *   "projects": [ { "id": 1, "name": "...", "description": "..." } ],
 *   "tasks": [ { "id", "title", "description", "status", "priority", "projectId", "assignedTo", "dueDate", "estimatedHours", "actualHours", "createdBy", "createdAt", "updatedAt" } ],
 *   "comments": [ { "id", "taskId", "userId", "commentText", "createdAt" } ],
 *   "history": [ { "id", "taskId", "userId", "action", "oldValue", "newValue", "timestamp" } ],
 *   "notifications": [ { "id", "userId", "message", "type", "read", "createdAt" } ]
 * }
 *
 * Legacy numeric ids are mapped to MongoDB ObjectIds. References (projectId, assignedTo, etc.) are remapped.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const History = require('../models/History');
const Notification = require('../models/Notification');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

const dumpPath = process.argv[2];
if (!dumpPath) {
  console.error('Usage: node scripts/migrateFromLocalStorageDump.js <path-to-dump.json>');
  console.error('Example: node scripts/migrateFromLocalStorageDump.js ./legacy-dump.json');
  process.exit(1);
}

const fullPath = path.isAbsolute(dumpPath) ? dumpPath : path.resolve(process.cwd(), dumpPath);
if (!fs.existsSync(fullPath)) {
  console.error('File not found:', fullPath);
  process.exit(1);
}

let dump;
try {
  dump = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
} catch (e) {
  console.error('Invalid JSON:', e.message);
  process.exit(1);
}

const users = Array.isArray(dump.users) ? dump.users : [];
const projects = Array.isArray(dump.projects) ? dump.projects : [];
const tasks = Array.isArray(dump.tasks) ? dump.tasks : [];
const comments = Array.isArray(dump.comments) ? dump.comments : [];
const history = Array.isArray(dump.history) ? dump.history : [];
const notifications = Array.isArray(dump.notifications) ? dump.notifications : [];

const userOldToNew = new Map();
const projectOldToNew = new Map();
const taskOldToNew = new Map();

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Users (hash passwords, map old id -> new _id)
  let firstUserId = null;
  console.log('Migrating users...');
  for (const u of users) {
    const passwordHash = await User.hashPassword(u.password || '');
    const doc = await User.create({
      username: String(u.username || '').trim(),
      passwordHash,
    });
    userOldToNew.set(Number(u.id), doc._id);
    if (!firstUserId) firstUserId = doc._id;
  }
  console.log('Users:', userOldToNew.size);

  // 2. Projects
  console.log('Migrating projects...');
  for (const p of projects) {
    const doc = await Project.create({
      name: String(p.name || '').trim(),
      description: String(p.description ?? ''),
    });
    projectOldToNew.set(Number(p.id), doc._id);
  }
  console.log('Projects:', projectOldToNew.size);

  // 3. Tasks (map projectId, assignedTo, createdBy)
  console.log('Migrating tasks...');
  for (const t of tasks) {
    const projectId = t.projectId && projectOldToNew.has(Number(t.projectId)) ? projectOldToNew.get(Number(t.projectId)) : null;
    const assignedTo = t.assignedTo && userOldToNew.has(Number(t.assignedTo)) ? userOldToNew.get(Number(t.assignedTo)) : null;
    const createdBy = userOldToNew.has(Number(t.createdBy)) ? userOldToNew.get(Number(t.createdBy)) : firstUserId;
    if (!createdBy) {
      console.warn('Task skipped (no users in dump):', t.id, t.title);
      continue;
    }
    const doc = await Task.create({
      title: String(t.title || '').trim(),
      description: String(t.description ?? ''),
      status: ['Pendiente', 'En Progreso', 'Completada', 'Bloqueada', 'Cancelada'].includes(t.status) ? t.status : 'Pendiente',
      priority: ['Baja', 'Media', 'Alta', 'Crítica'].includes(t.priority) ? t.priority : 'Media',
      projectId,
      assignedTo,
      dueDate: String(t.dueDate ?? ''),
      estimatedHours: Number(t.estimatedHours) || 0,
      actualHours: Number(t.actualHours) || 0,
      createdBy,
    });
    taskOldToNew.set(Number(t.id), doc._id);
  }
  console.log('Tasks:', taskOldToNew.size);

  // 4. Comments
  console.log('Migrating comments...');
  let commentsOk = 0;
  for (const c of comments) {
    const taskId = taskOldToNew.has(Number(c.taskId)) ? taskOldToNew.get(Number(c.taskId)) : null;
    const userId = userOldToNew.has(Number(c.userId)) ? userOldToNew.get(Number(c.userId)) : null;
    if (!taskId || !userId) continue;
    await Comment.create({
      taskId,
      userId,
      commentText: String(c.commentText ?? '').trim(),
    });
    commentsOk++;
  }
  console.log('Comments:', commentsOk);

  // 5. History
  console.log('Migrating history...');
  let historyOk = 0;
  for (const h of history) {
    const taskId = taskOldToNew.has(Number(h.taskId)) ? taskOldToNew.get(Number(h.taskId)) : null;
    const userId = userOldToNew.has(Number(h.userId)) ? userOldToNew.get(Number(h.userId)) : null;
    if (!taskId || !userId) continue;
    const action = ['CREATED', 'STATUS_CHANGED', 'TITLE_CHANGED', 'DELETED'].includes(h.action) ? h.action : 'CREATED';
    await History.create({
      taskId,
      userId,
      action,
      oldValue: String(h.oldValue ?? ''),
      newValue: String(h.newValue ?? ''),
      timestamp: h.timestamp ? new Date(h.timestamp) : new Date(),
    });
    historyOk++;
  }
  console.log('History:', historyOk);

  // 6. Notifications
  console.log('Migrating notifications...');
  let notifOk = 0;
  for (const n of notifications) {
    const userId = userOldToNew.has(Number(n.userId)) ? userOldToNew.get(Number(n.userId)) : null;
    if (!userId) continue;
    const type = ['task_assigned', 'task_updated'].includes(n.type) ? n.type : 'task_updated';
    await Notification.create({
      userId,
      message: String(n.message ?? ''),
      type,
      read: Boolean(n.read),
    });
    notifOk++;
  }
  console.log('Notifications:', notifOk);

  console.log('Migration finished.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
