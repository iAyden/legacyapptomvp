import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Search as SearchIcon, FolderKanban } from 'lucide-react';

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

export default function Search() {
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/projects').then((data) => setProjects(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const search = async () => {
    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText.trim()) params.set('searchText', searchText.trim());
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      if (projectId) params.set('projectId', projectId);
      const data = await api(`/api/tasks?${params.toString()}`);
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const projectName = (task) => {
    if (task.projectId?.name) return task.projectId.name;
    const p = projects.find((x) => (x.id || x._id) === (task.projectId?.id || task.projectId));
    return p ? p.name : 'Sin proyecto';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Busqueda Avanzada</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Encuentra tareas con filtros avanzados</p>
      </div>

      <div className="card p-5">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Texto</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} className="input-field pl-9" placeholder="Buscar..." />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Estado</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field">
              <option value="">Todos</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Prioridad</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-field">
              <option value="">Todas</option>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Proyecto</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="input-field">
              <option value="">Todos</option>
              {projects.map((p) => <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <button type="button" onClick={search} disabled={loading} className="btn-primary mt-4">
          <SearchIcon className="w-4 h-4" />
          Buscar
        </button>
        {error && <p className="mt-3 text-sm text-[hsl(var(--destructive))]">{error}</p>}
      </div>

      <div className="card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
                <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Titulo</th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Prioridad</th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Proyecto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8"><div className="w-6 h-6 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-[hsl(var(--muted-foreground))]">Usa los filtros para buscar tareas</td></tr>
              ) : tasks.map((task) => (
                <tr key={task.id || task._id} className="hover:bg-[hsl(var(--accent))] transition-colors">
                  <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{task.title}</td>
                  <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                    <span className="flex items-center gap-1.5"><FolderKanban className="w-3.5 h-3.5" />{projectName(task)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile */}
        <div className="md:hidden divide-y divide-[hsl(var(--border))]">
          {loading ? (
            <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" /></div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">Usa los filtros para buscar tareas</div>
          ) : tasks.map((task) => (
            <div key={task.id || task._id} className="p-4">
              <p className="font-medium text-[hsl(var(--foreground))]">{task.title}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 flex items-center gap-1"><FolderKanban className="w-3 h-3" />{projectName(task)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
