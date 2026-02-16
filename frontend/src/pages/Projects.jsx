import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });
  const [selectedId, setSelectedId] = useState(null);

  const load = async () => {
    try {
      setError('');
      const data = await api('/api/projects');
      setProjects(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectProject = (p) => {
    const id = p.id || p._id;
    setSelectedId(selectedId === id ? null : id);
    setForm({ name: p.name || '', description: p.description || '' });
  };

  const clearSelection = () => {
    setSelectedId(null);
    setForm({ name: '', description: '' });
  };

  const addProject = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    setError('');
    try {
      await api('/api/projects', { method: 'POST', body: { name: form.name.trim(), description: form.description || '' } });
      setForm({ name: '', description: '' });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const updateProject = async (e) => {
    e.preventDefault();
    if (!selectedId) { setError('Selecciona un proyecto de la lista'); return; }
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    setError('');
    try {
      await api(`/api/projects/${selectedId}`, { method: 'PUT', body: { name: form.name.trim(), description: form.description || '' } });
      clearSelection();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const deleteProject = async () => {
    if (!selectedId) return;
    const p = projects.find((x) => (x.id || x._id) === selectedId);
    if (!p || !confirm(`¿Eliminar proyecto: ${p.name}?`)) return;
    try {
      await api(`/api/projects/${selectedId}`, { method: 'DELETE' });
      clearSelection();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <p className="text-slate-600">Cargando proyectos...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">Gestión de Proyectos</h2>

      <section className="bg-white rounded-xl shadow p-4 md:p-6">
        <h3 className="font-medium text-slate-700 mb-4">Crear o editar proyecto</h3>
        <form onSubmit={addProject} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Nombre *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder={selectedId ? 'Selecciona un proyecto para editar' : ''}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">Crear proyecto</button>
            <button type="button" onClick={updateProject} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 text-sm">Renombrar / actualizar</button>
            <button type="button" onClick={deleteProject} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 text-sm">Eliminar</button>
            {selectedId && (
              <button type="button" onClick={clearSelection} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-sm">Cancelar</button>
            )}
          </div>
        </form>
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
      </section>

      <section className="bg-white rounded-xl shadow overflow-hidden">
        <h3 className="font-medium text-slate-700 p-4">Lista de proyectos</h3>
        {/* Desktop: table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Nombre</th>
                <th className="text-left p-2">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr
                  key={p.id || p._id}
                  onClick={() => selectProject(p)}
                  className={`border-t cursor-pointer hover:bg-slate-50 ${selectedId === (p.id || p._id) ? 'bg-slate-200' : ''}`}
                >
                  <td className="p-2">{p.id || p._id}</td>
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.description || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile: cards */}
        <div className="md:hidden divide-y">
          {projects.map((p) => (
            <div
              key={p.id || p._id}
              onClick={() => selectProject(p)}
              className={`p-4 cursor-pointer active:bg-slate-50 ${selectedId === (p.id || p._id) ? 'bg-slate-200' : ''}`}
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-slate-500 mt-0.5">{p.description || 'Sin descripción'}</div>
              <div className="text-xs text-slate-400 mt-1">ID: {p.id || p._id}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
