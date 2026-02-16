import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  FolderKanban,
  X,
  Pencil,
  Trash2,
  Send,
  ChevronDown,
  BarChart3,
  MessageSquare,
  History,
} from 'lucide-react';

const STATUS_OPTIONS = ['Pendiente', 'En Progreso', 'Completada', 'Bloqueada', 'Cancelada'];
const PRIORITY_OPTIONS = ['Baja', 'Media', 'Alta', 'Critica'];

function StatusBadge({ status }) {
  const map = {
    'Pendiente': 'badge-pendiente',
    'En Progreso': 'badge-progreso',
    'Completada': 'badge-completada',
    'Bloqueada': 'badge-bloqueada',
    'Cancelada': 'badge-cancelada',
  };
  return <span className={`badge ${map[status] || 'badge-pendiente'}`}>{status || 'Pendiente'}</span>;
}

function PriorityBadge({ priority }) {
  const map = {
    'Baja': 'badge-baja',
    'Media': 'badge-media',
    'Alta': 'badge-alta',
    'Critica': 'badge-critica',
  };
  return <span className={`badge ${map[priority] || 'badge-media'}`}>{priority || 'Media'}</span>;
}

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 500;
const HOURS_MAX = 10000;

function TaskModal({ open, onClose, form, setForm, onSubmit, projects, users, title, submitLabel, error }) {
  const overlayRef = useRef(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'title':
        if (!value.trim()) return 'El titulo es requerido';
        if (value.trim().length < 3) return 'Minimo 3 caracteres';
        if (value.length > TITLE_MAX) return `Maximo ${TITLE_MAX} caracteres`;
        return '';
      case 'description':
        if (value.length > DESCRIPTION_MAX) return `Maximo ${DESCRIPTION_MAX} caracteres`;
        return '';
      case 'estimatedHours':
        if (value === '' || value === undefined) return '';
        { const num = parseFloat(value);
        if (isNaN(num)) return 'Debe ser un numero valido';
        if (num < 0) return 'No se permiten valores negativos';
        if (num > HOURS_MAX) return `Maximo ${HOURS_MAX} horas`;
        return ''; }
      default:
        return '';
    }
  };

  const handleChange = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    const err = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const validateAll = () => {
    const errors = {};
    errors.title = validateField('title', form.title);
    errors.description = validateField('description', form.description);
    errors.estimatedHours = validateField('estimatedHours', form.estimatedHours);
    setFieldErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    onSubmit(e);
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-lg bg-[hsl(var(--card))] rounded-xl shadow-xl border border-[hsl(var(--border))] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{title}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors" aria-label="Cerrar modal">
            <X className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Titulo *</label>
            <input
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`input-field ${fieldErrors.title ? 'border-[hsl(var(--destructive))] focus:ring-[hsl(var(--destructive))]' : ''}`}
              placeholder="Nombre de la tarea"
              maxLength={TITLE_MAX}
              required
            />
            <div className="flex items-center justify-between mt-1">
              {fieldErrors.title && <p className="text-xs text-[hsl(var(--destructive))]">{fieldErrors.title}</p>}
              <p className="text-xs text-[hsl(var(--muted-foreground))] ml-auto">{form.title.length}/{TITLE_MAX}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Descripcion</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={`input-field resize-none ${fieldErrors.description ? 'border-[hsl(var(--destructive))] focus:ring-[hsl(var(--destructive))]' : ''}`}
              placeholder="Describe la tarea..."
              maxLength={DESCRIPTION_MAX}
            />
            <div className="flex items-center justify-between mt-1">
              {fieldErrors.description && <p className="text-xs text-[hsl(var(--destructive))]">{fieldErrors.description}</p>}
              <p className="text-xs text-[hsl(var(--muted-foreground))] ml-auto">{form.description.length}/{DESCRIPTION_MAX}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Estado</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="input-field"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Prioridad</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="input-field"
              >
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Proyecto</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
                className="input-field"
              >
                <option value="">Sin proyecto</option>
                {projects.map((p) => <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Asignado a</label>
              <select
                value={form.assignedTo}
                onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
                className="input-field"
              >
                <option value="">Sin asignar</option>
                {users.map((u) => <option key={u.id || u._id} value={u.id || u._id}>{u.username}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Fecha vencimiento</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Horas estimadas</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max={HOURS_MAX}
                value={form.estimatedHours}
                onChange={(e) => handleChange('estimatedHours', e.target.value)}
                className={`input-field ${fieldErrors.estimatedHours ? 'border-[hsl(var(--destructive))] focus:ring-[hsl(var(--destructive))]' : ''}`}
                placeholder="0"
              />
              {fieldErrors.estimatedHours && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{fieldErrors.estimatedHours}</p>}
            </div>
          </div>

          {error && <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" className="btn-primary">{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ searchText: '', status: '', priority: '', projectId: '' });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'Pendiente',
    priority: 'Media',
    projectId: '',
    assignedTo: '',
    dueDate: '',
    estimatedHours: '',
  });
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = async () => {
    try {
      setError('');
      const params = new URLSearchParams();
      if (appliedFilters.searchText?.trim()) params.set('searchText', appliedFilters.searchText.trim());
      if (appliedFilters.status) params.set('status', appliedFilters.status);
      if (appliedFilters.priority) params.set('priority', appliedFilters.priority);
      if (appliedFilters.projectId) params.set('projectId', appliedFilters.projectId);
      const qs = params.toString();
      const [tasksRes, projectsRes, usersRes, statsRes] = await Promise.all([
        api(`/api/tasks${qs ? '?' + qs : ''}`),
        api('/api/projects'),
        api('/api/users'),
        api('/api/tasks/stats'),
      ]);
      setTasks(Array.isArray(tasksRes) ? tasksRes : []);
      setProjects(Array.isArray(projectsRes) ? projectsRes : []);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setStats(statsRes);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [appliedFilters.searchText, appliedFilters.status, appliedFilters.priority, appliedFilters.projectId]);

  const loadDetail = async (taskId) => {
    if (!taskId) return;
    setLoadingDetail(true);
    try {
      const [c, h] = await Promise.all([
        api(`/api/comments/task/${taskId}`),
        api(`/api/history/task/${taskId}`),
      ]);
      setComments(Array.isArray(c) ? c : []);
      setHistory(Array.isArray(h) ? h : []);
    } catch {
      setComments([]);
      setHistory([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    else { setComments([]); setHistory([]); setCommentText(''); }
  }, [selectedId]);

  const emptyForm = () => ({
    title: '',
    description: '',
    status: 'Pendiente',
    priority: 'Media',
    projectId: '',
    assignedTo: '',
    dueDate: '',
    estimatedHours: '',
  });

  const openAddModal = () => {
    setForm(emptyForm());
    setError('');
    setModalMode('add');
  };

  const openEditModal = (task) => {
    const id = task.id || task._id;
    setSelectedId(id);
    setForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'Pendiente',
      priority: task.priority || 'Media',
      projectId: task.projectId?.id || task.projectId || '',
      assignedTo: task.assignedTo?.id || task.assignedTo || '',
      dueDate: task.dueDate || '',
      estimatedHours: task.estimatedHours ?? '',
    });
    setError('');
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setError('');
  };

  const selectTask = (task) => {
    const id = task.id || task._id;
    setSelectedId(selectedId === id ? null : id);
  };

  const validateTaskForm = () => {
    if (!form.title.trim()) { setError('El titulo es requerido'); return false; }
    if (form.title.trim().length < 3) { setError('El titulo debe tener al menos 3 caracteres'); return false; }
    if (form.title.length > TITLE_MAX) { setError(`El titulo no puede superar ${TITLE_MAX} caracteres`); return false; }
    if (form.description.length > DESCRIPTION_MAX) { setError(`La descripcion no puede superar ${DESCRIPTION_MAX} caracteres`); return false; }
    const hours = parseFloat(form.estimatedHours);
    if (form.estimatedHours !== '' && !isNaN(hours)) {
      if (hours < 0) { setError('Las horas estimadas no pueden ser negativas'); return false; }
      if (hours > HOURS_MAX) { setError(`Las horas estimadas no pueden superar ${HOURS_MAX}`); return false; }
    }
    return true;
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!validateTaskForm()) return;
    setError('');
    try {
      const hours = parseFloat(form.estimatedHours);
      await api('/api/tasks', {
        method: 'POST',
        body: {
          title: form.title.trim(),
          description: form.description.trim(),
          status: form.status,
          priority: form.priority,
          projectId: form.projectId || null,
          assignedTo: form.assignedTo || null,
          dueDate: form.dueDate || '',
          estimatedHours: (!isNaN(hours) && hours >= 0) ? hours : 0,
        },
      });
      closeModal();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const updateTask = async (e) => {
    e.preventDefault();
    if (!selectedId) { setError('Selecciona una tarea'); return; }
    if (!validateTaskForm()) return;
    setError('');
    try {
      const hours = parseFloat(form.estimatedHours);
      await api(`/api/tasks/${selectedId}`, {
        method: 'PUT',
        body: {
          title: form.title.trim(),
          description: form.description.trim(),
          status: form.status,
          priority: form.priority,
          projectId: form.projectId || null,
          assignedTo: form.assignedTo || null,
          dueDate: form.dueDate || '',
          estimatedHours: (!isNaN(hours) && hours >= 0) ? hours : 0,
        },
      });
      closeModal();
      load();
      loadDetail(selectedId);
    } catch (e) {
      setError(e.message);
    }
  };

  const deleteTask = async (taskId) => {
    if (!taskId) return;
    if (!confirm('Eliminar esta tarea?')) return;
    try {
      await api(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (selectedId === taskId) setSelectedId(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!selectedId || !commentText.trim()) return;
    try {
      await api('/api/comments', { method: 'POST', body: { taskId: selectedId, commentText: commentText.trim() } });
      setCommentText('');
      loadDetail(selectedId);
    } catch (e) {
      setError(e.message);
    }
  };

  const projectName = (task) => {
    if (task.projectId?.name) return task.projectId.name;
    const p = projects.find((x) => (x.id || x._id) === (task.projectId?.id || task.projectId));
    return p ? p.name : 'Sin proyecto';
  };
  const assignedName = (task) => {
    if (task.assignedTo?.username) return task.assignedTo.username;
    const u = users.find((x) => (x.id || x._id) === (task.assignedTo?.id || task.assignedTo));
    return u ? u.username : 'Sin asignar';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Tareas</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Gestiona y organiza tus tareas</p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nueva tarea
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: tasks.length, color: 'text-[hsl(var(--primary))]' },
            { label: 'Pendientes', value: tasks.filter(t => t.status === 'Pendiente').length, color: 'text-amber-600' },
            { label: 'En Progreso', value: tasks.filter(t => t.status === 'En Progreso').length, color: 'text-blue-600' },
            { label: 'Completadas', value: tasks.filter(t => t.status === 'Completada').length, color: 'text-emerald-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card px-4 py-3">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          {(appliedFilters.searchText || appliedFilters.status || appliedFilters.priority || appliedFilters.projectId) && (
            <button
              type="button"
              onClick={() => { setFilters({ searchText: '', status: '', priority: '', projectId: '' }); setAppliedFilters({}); }}
              className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        {showFilters && (
          <div className="px-4 py-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="text"
                  placeholder="Buscar por titulo..."
                  value={filters.searchText}
                  onChange={(e) => setFilters((f) => ({ ...f, searchText: e.target.value }))}
                  className="input-field pl-9"
                />
              </div>
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="input-field"
              >
                <option value="">Estado: todos</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filters.priority}
                onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
                className="input-field"
              >
                <option value="">Prioridad: todas</option>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                value={filters.projectId}
                onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
                className="input-field"
              >
                <option value="">Proyecto: todos</option>
                {projects.map((p) => <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setAppliedFilters({ ...filters })}
                className="btn-primary"
              >
                <Search className="w-4 h-4" />
                Buscar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
                <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Titulo</th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Prioridad</th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Proyecto</th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Asignado</th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Vencimiento</th>
                <th className="text-right px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                    No hay tareas. Crea una nueva tarea para empezar.
                  </td>
                </tr>
              ) : tasks.map((task) => {
                const id = task.id || task._id;
                const isSelected = selectedId === id;
                return (
                  <tr
                    key={id}
                    onClick={() => selectTask(task)}
                    className={`cursor-pointer transition-colors hover:bg-[hsl(var(--accent))] ${isSelected ? 'bg-[hsl(var(--primary))]/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-[hsl(var(--foreground))]">{task.title}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1.5">
                        <FolderKanban className="w-3.5 h-3.5" />
                        {projectName(task)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {assignedName(task)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {task.dueDate || 'Sin fecha'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                          className="p-1.5 rounded-md hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                          aria-label="Editar tarea"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); deleteTask(id); }}
                          className="p-1.5 rounded-md hover:bg-red-50 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors"
                          aria-label="Eliminar tarea"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-[hsl(var(--border))]">
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-[hsl(var(--muted-foreground))]">
              No hay tareas. Crea una nueva tarea para empezar.
            </div>
          ) : tasks.map((task) => {
            const id = task.id || task._id;
            const isSelected = selectedId === id;
            return (
              <div
                key={id}
                onClick={() => selectTask(task)}
                className={`p-4 cursor-pointer transition-colors active:bg-[hsl(var(--accent))] ${isSelected ? 'bg-[hsl(var(--primary))]/5' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[hsl(var(--foreground))] truncate">{task.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1"><FolderKanban className="w-3 h-3" />{projectName(task)}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{assignedName(task)}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{task.dueDate || 'Sin fecha'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                      className="p-1.5 rounded-md hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]"
                      aria-label="Editar tarea"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteTask(id); }}
                      className="p-1.5 rounded-md hover:bg-red-50 text-[hsl(var(--muted-foreground))]"
                      aria-label="Eliminar tarea"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task detail panel */}
      {selectedId && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
            <h3 className="font-semibold text-[hsl(var(--foreground))]">Detalles de la tarea</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2 p-5">
            {/* Comments */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">Comentarios</h4>
              </div>
              <form onSubmit={addComment} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="input-field flex-1"
                />
                <button type="submit" className="btn-primary px-3" aria-label="Enviar comentario">
                  <Send className="w-4 h-4" />
                </button>
              </form>
              {loadingDetail ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Cargando...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">No hay comentarios</p>
              ) : (
                <ul className="space-y-3">
                  {comments.map((c) => (
                    <li key={c.id || c._id} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center text-xs font-medium text-[hsl(var(--secondary-foreground))] shrink-0 mt-0.5">
                        {(c.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[hsl(var(--foreground))]">{c.username || 'Usuario'}</span>
                          {c.createdAt && <span className="text-xs text-[hsl(var(--muted-foreground))]">{new Date(c.createdAt).toLocaleString()}</span>}
                        </div>
                        <p className="text-sm text-[hsl(var(--foreground))]/80 mt-0.5">{c.commentText}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* History */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">Historial</h4>
              </div>
              {loadingDetail ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Cargando...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">No hay historial</p>
              ) : (
                <ul className="space-y-3">
                  {history.map((entry) => (
                    <li key={entry.id || entry._id} className="relative pl-4 border-l-2 border-[hsl(var(--border))]">
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">{entry.action}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        {entry.username || 'Usuario'} - {entry.oldValue || '(vacio)'} {'-->'} {entry.newValue || '(vacio)'}
                      </p>
                      {entry.timestamp && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))]/60 mt-0.5">{new Date(entry.timestamp).toLocaleString()}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <TaskModal
        open={modalMode === 'add'}
        onClose={closeModal}
        form={form}
        setForm={setForm}
        onSubmit={addTask}
        projects={projects}
        users={users}
        title="Nueva tarea"
        submitLabel="Crear tarea"
        error={error}
      />

      {/* Edit Task Modal */}
      <TaskModal
        open={modalMode === 'edit'}
        onClose={closeModal}
        form={form}
        setForm={setForm}
        onSubmit={updateTask}
        projects={projects}
        users={users}
        title="Editar tarea"
        submitLabel="Guardar cambios"
        error={error}
      />

      {error && !modalMode && (
        <div className="card px-4 py-3 border-[hsl(var(--destructive))]/20 bg-[hsl(var(--destructive))]/5">
          <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
        </div>
      )}
    </div>
  );
}
