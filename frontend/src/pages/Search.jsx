import { useState, useEffect } from 'react';
import { api } from '../lib/api';

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
      <h2 className="text-xl font-semibold text-slate-800">Búsqueda Avanzada</h2>

      <section className="bg-white rounded-xl shadow p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Texto</label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Estado</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Progreso">En Progreso</option>
              <option value="Completada">Completada</option>
              <option value="Bloqueada">Bloqueada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Prioridad</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Todas</option>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Proyecto</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Todos</option>
              {projects.map((p) => (
                <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" onClick={search} disabled={loading} className="mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Buscar</button>
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
      </section>

      <section className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Título</th>
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Prioridad</th>
                <th className="text-left p-2">Proyecto</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id || task._id} className="border-t hover:bg-slate-50">
                  <td className="p-2">{task.id || task._id}</td>
                  <td className="p-2">{task.title}</td>
                  <td className="p-2">{task.status || 'Pendiente'}</td>
                  <td className="p-2">{task.priority || 'Media'}</td>
                  <td className="p-2">{projectName(task)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
