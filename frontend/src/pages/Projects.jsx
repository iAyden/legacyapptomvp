import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Plus, Pencil, Trash2, X, FolderKanban } from 'lucide-react';

function ProjectModal({ open, onClose, form, setForm, onSubmit, title, submitLabel, error }) {
  const overlayRef = useRef(null);
  if (!open) return null;
  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="w-full max-w-md card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{title}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors">
            <X className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Nombre *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Nombre del proyecto" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Descripcion</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Describe el proyecto..." />
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

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });
  const [selectedId, setSelectedId] = useState(null);
  const [modalMode, setModalMode] = useState(null);

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

  const openAdd = () => { setForm({ name: '', description: '' }); setError(''); setModalMode('add'); };
  const openEdit = (p) => {
    setSelectedId(p.id || p._id);
    setForm({ name: p.name || '', description: p.description || '' });
    setError('');
    setModalMode('edit');
  };
  const closeModal = () => { setModalMode(null); setError(''); };

  const addProject = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    setError('');
    try {
      await api('/api/projects', { method: 'POST', body: { name: form.name.trim(), description: form.description || '' } });
      closeModal();
      load();
    } catch (e) { setError(e.message); }
  };

  const updateProject = async (e) => {
    e.preventDefault();
    if (!selectedId || !form.name.trim()) { setError('El nombre es requerido'); return; }
    setError('');
    try {
      await api(`/api/projects/${selectedId}`, { method: 'PUT', body: { name: form.name.trim(), description: form.description || '' } });
      closeModal();
      setSelectedId(null);
      load();
    } catch (e) { setError(e.message); }
  };

  const deleteProject = async (id) => {
    const p = projects.find((x) => (x.id || x._id) === id);
    if (!p || !confirm(`Eliminar proyecto: ${p.name}?`)) return;
    try {
      await api(`/api/projects/${id}`, { method: 'DELETE' });
      if (selectedId === id) setSelectedId(null);
      load();
    } catch (e) { setError(e.message); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Proyectos</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Organiza tus tareas por proyecto</p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuevo proyecto
        </button>
      </div>

      {error && !modalMode && (
        <div className="card px-4 py-3 border-[hsl(var(--destructive))]/20 bg-[hsl(var(--destructive))]/5">
          <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
        </div>
      )}

      {/* Project grid */}
      {projects.length === 0 ? (
        <div className="card py-16 text-center">
          <FolderKanban className="w-10 h-10 mx-auto text-[hsl(var(--muted-foreground))]/40 mb-3" />
          <p className="text-[hsl(var(--muted-foreground))]">No hay proyectos. Crea uno para empezar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const id = p.id || p._id;
            return (
              <div key={id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-5 h-5 text-[hsl(var(--primary))]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[hsl(var(--foreground))] truncate">{p.name}</h3>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-2">{p.description || 'Sin descripcion'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => deleteProject(id)} className="p-1.5 rounded-md hover:bg-red-50 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectModal open={modalMode === 'add'} onClose={closeModal} form={form} setForm={setForm} onSubmit={addProject} title="Nuevo proyecto" submitLabel="Crear proyecto" error={error} />
      <ProjectModal open={modalMode === 'edit'} onClose={closeModal} form={form} setForm={setForm} onSubmit={updateProject} title="Editar proyecto" submitLabel="Guardar cambios" error={error} />
    </div>
  );
}
