import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const STATUS_OPTIONS = ['Pendiente', 'En Progreso', 'Completada', 'Bloqueada', 'Cancelada'];
const PRIORITY_OPTIONS = ['Baja', 'Media', 'Alta', 'Crítica'];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
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

  const clearForm = () => {
    setSelectedId(null);
    setShowForm(false);
    setForm({
      title: '',
      description: '',
      status: 'Pendiente',
      priority: 'Media',
      projectId: '',
      assignedTo: '',
      dueDate: '',
      estimatedHours: '',
    });
  };

  const selectTask = (task) => {
    const id = task.id || task._id;
    setSelectedId(selectedId === id ? null : id);
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
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('El título es requerido'); return; }
    setError('');
    try {
      await api('/api/tasks', {
        method: 'POST',
        body: {
          title: form.title.trim(),
          description: form.description || '',
          status: form.status,
          priority: form.priority,
          projectId: form.projectId || null,
          assignedTo: form.assignedTo || null,
          dueDate: form.dueDate || '',
          estimatedHours: parseFloat(form.estimatedHours) || 0,
        },
      });
      clearForm();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const updateTask = async (e) => {
    e.preventDefault();
    if (!selectedId) { setError('Selecciona una tarea'); return; }
    if (!form.title.trim()) { setError('El título es requerido'); return; }
    setError('');
    try {
      await api(`/api/tasks/${selectedId}`, {
        method: 'PUT',
        body: {
          title: form.title.trim(),
          description: form.description || '',
          status: form.status,
          priority: form.priority,
          projectId: form.projectId || null,
          assignedTo: form.assignedTo || null,
          dueDate: form.dueDate || '',
          estimatedHours: parseFloat(form.estimatedHours) || 0,
        },
      });
      load();
      loadDetail(selectedId);
    } catch (e) {
      setError(e.message);
    }
  };

  const deleteTask = async () => {
    if (!selectedId) return;
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await api(`/api/tasks/${selectedId}`, { method: 'DELETE' });
      clearForm();
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

  if (loading) return <p className="text-slate-600">Cargando tareas...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-800">Gestión de Tareas</h2>
        <button
          type="button"
          onClick={() => { setShowForm(!showForm); if (!showForm) clearForm(); }}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm"
        >
          {showForm ? 'Ocultar formulario' : 'Nueva tarea'}
        </button>
      </div>

      {/* Filters - matching legacy search */}
      <section className="bg-white rounded-xl shadow p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Filtros</h3>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
          <input
            type="text"
            placeholder="Texto (título/descripción)"
            value={filters.searchText}
            onChange={(e) => setFilters((f) => ({ ...f, searchText: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Estado: todos</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Prioridad: todas</option>
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={filters.projectId}
            onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Proyecto: todos</option>
            {projects.map((p) => <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setAppliedFilters({ ...filters })}
            className="px-3 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-500"
          >
            Buscar
          </button>
        </div>
      </section>

      {(showForm || selectedId) && (
        <section className="bg-white rounded-xl shadow p-4 md:p-6">
          <h3 className="font-medium text-slate-700 mb-4">{selectedId ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
          <form onSubmit={addTask} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Título *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Estado</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Prioridad</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Proyecto</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Sin proyecto</option>
                {projects.map((p) => <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Asignado a</label>
              <select
                value={form.assignedTo}
                onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Sin asignar</option>
                {users.map((u) => <option key={u.id || u._id} value={u.id || u._id}>{u.username}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Fecha vencimiento</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Horas estimadas</label>
              <input
                type="number"
                step="0.5"
                value={form.estimatedHours}
                onChange={(e) => setForm((f) => ({ ...f, estimatedHours: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <button type="submit" className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">Agregar</button>
              <button type="button" onClick={updateTask} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 text-sm">Actualizar</button>
              <button type="button" onClick={deleteTask} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 text-sm">Eliminar</button>
              <button type="button" onClick={clearForm} className="px-4 py-2 border rounded-lg hover:bg-slate-100 text-sm">Limpiar</button>
            </div>
          </form>
          {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
        </section>
      )}

      {/* Desktop: table | Mobile: cards */}
      <section className="bg-white rounded-xl shadow overflow-hidden">
        <h3 className="font-medium text-slate-700 p-4">Lista de Tareas</h3>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Título</th>
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Prioridad</th>
                <th className="text-left p-2">Proyecto</th>
                <th className="text-left p-2">Asignado</th>
                <th className="text-left p-2">Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id || task._id}
                  onClick={() => selectTask(task)}
                  className={`border-t cursor-pointer hover:bg-slate-50 ${selectedId === (task.id || task._id) ? 'bg-slate-200' : ''}`}
                >
                  <td className="p-2">{task.id || task._id}</td>
                  <td className="p-2">{task.title}</td>
                  <td className="p-2">{task.status || 'Pendiente'}</td>
                  <td className="p-2">{task.priority || 'Media'}</td>
                  <td className="p-2">{projectName(task)}</td>
                  <td className="p-2">{assignedName(task)}</td>
                  <td className="p-2">{task.dueDate || 'Sin fecha'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden divide-y">
          {tasks.map((task) => (
            <div
              key={task.id || task._id}
              onClick={() => selectTask(task)}
              className={`p-4 cursor-pointer active:bg-slate-50 ${selectedId === (task.id || task._id) ? 'bg-slate-200' : ''}`}
            >
              <div className="font-medium">{task.title}</div>
              <div className="text-sm text-slate-600 mt-1">
                {task.status || 'Pendiente'} · {task.priority || 'Media'}
              </div>
              <div className="text-sm text-slate-500 mt-0.5">
                {projectName(task)} · {assignedName(task)} · {task.dueDate || 'Sin fecha'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Task detail: comments + history (when a task is selected) */}
      {selectedId && (
        <section className="bg-white rounded-xl shadow p-4 md:p-6 space-y-4">
          <h3 className="font-medium text-slate-700">Tarea seleccionada: comentarios e historial</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-slate-600 mb-2">Comentarios</h4>
              <form onSubmit={addComment} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Añadir comentario..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <button type="submit" className="px-3 py-2 bg-slate-600 text-white rounded-lg text-sm">Enviar</button>
              </form>
              {loadingDetail ? (
                <p className="text-slate-500 text-sm">Cargando...</p>
              ) : comments.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay comentarios</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {comments.map((c) => (
                    <li key={c.id || c._id} className="border-l-2 border-slate-200 pl-2">
                      <span className="text-slate-500">{c.username || 'Usuario'}</span>
                      {c.createdAt && <span className="text-slate-400 text-xs ml-1">{new Date(c.createdAt).toLocaleString()}</span>}
                      <p className="mt-0.5">{c.commentText}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-600 mb-2">Historial</h4>
              {loadingDetail ? (
                <p className="text-slate-500 text-sm">Cargando...</p>
              ) : history.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay historial</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {history.map((e) => (
                    <li key={e.id || e._id} className="border-l-2 border-slate-200 pl-2">
                      <span className="font-medium">{e.action}</span>
                      {e.timestamp && <span className="text-slate-400 text-xs ml-1">{new Date(e.timestamp).toLocaleString()}</span>}
                      <p className="text-slate-600 text-xs mt-0.5">{e.username || 'Usuario'}: {e.oldValue || '(vacío)'} → {e.newValue || '(vacío)'}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {stats && (
        <div className="bg-slate-100 rounded-lg px-4 py-3 text-sm">
          <strong>Estadísticas:</strong> {stats.statsText}
        </div>
      )}
    </div>
  );
}
