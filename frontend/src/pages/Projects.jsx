import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Plus, Pencil, Trash2, X, FolderKanban } from 'lucide-react';

const PROJECT_NAME_MAX = 60;
const PROJECT_DESC_MAX = 300;

function ProjectModal({ open, onClose, form, setForm, onSubmit, title, submitLabel, error }) {
  const overlayRef = useRef(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    let err = '';
    if (name === 'name') {
      if (!value.trim()) err = 'El nombre es requerido';
      else if (value.trim().length < 2) err = 'Minimo 2 caracteres';
      else if (value.length > PROJECT_NAME_MAX) err = `Maximo ${PROJECT_NAME_MAX} caracteres`;
    }
    if (name === 'description') {
      if (value.length > PROJECT_DESC_MAX) err = `Maximo ${PROJECT_DESC_MAX} caracteres`;
    }
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const validateAll = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'El nombre es requerido';
    else if (form.name.trim().length < 2) errors.name = 'Minimo 2 caracteres';
    else if (form.name.length > PROJECT_NAME_MAX) errors.name = `Maximo ${PROJECT_NAME_MAX} caracteres`;
    if (form.description.length > PROJECT_DESC_MAX) errors.description = `Maximo ${PROJECT_DESC_MAX} caracteres`;
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
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="w-full max-w-md card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{title}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors" aria-label="Cerrar modal">
            <X className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Nombre *</label>
            <input
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`input-field ${fieldErrors.name ? 'border-[hsl(var(--destructive))] focus:ring-[hsl(var(--destructive))]' : ''}`}
              placeholder="Nombre del proyecto"
              maxLength={PROJECT_NAME_MAX}
              required
            />
            <div className="flex items-center justify-between mt-1">
              {fieldErrors.name && <p className="text-xs text-[hsl(var(--destructive))]">{fieldErrors.name}</p>}
              <p className="text-xs text-[hsl(var(--muted-foreground))] ml-auto">{form.name.length}/{PROJECT_NAME_MAX}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Descripcion</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={`input-field resize-none ${fieldErrors.description ? 'border-[hsl(var(--destructive))] focus:ring-[hsl(var(--destructive))]' : ''}`}
              placeholder="Describe el proyecto..."
              maxLength={PROJECT_DESC_MAX}
            />
            <div className="flex items-center justify-between mt-1">
              {fieldErrors.description && <p className="text-xs text-[hsl(var(--destructive))]">{fieldErrors.description}</p>}
              <p className="text-xs text-[hsl(var(--muted-foreground))] ml-auto">{form.description.length}/{PROJECT_DESC_MAX}</p>
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

  const validateProjectForm = () => {
    if (!form.name.trim()) { setError('El nombre es requerido'); return false; }
    if (form.name.trim().length < 2) { setError('El nombre debe tener al menos 2 caracteres'); return false; }
    if (form.name.length > PROJECT_NAME_MAX) { setError(`El nombre no puede superar ${PROJECT_NAME_MAX} caracteres`); return false; }
    if (form.description.length > PROJECT_DESC_MAX) { setError(`La descripcion no puede superar ${PROJECT_DESC_MAX} caracteres`); return false; }
    return true;
  };

  const addProject = async (e) => {
    e.preventDefault();
    if (!validateProjectForm()) return;
    setError('');
    try {
      await api('/api/projects', { method: 'POST', body: { name: form.name.trim(), description: form.description.trim() } });
      closeModal();
      load();
    } catch (e) { setError(e.message); }
  };

  const updateProject = async (e) => {
    e.preventDefault();
    if (!selectedId) { setError('Selecciona un proyecto'); return; }
    if (!validateProjectForm()) return;
    setError('');
    try {
      await api(`/api/projects/${selectedId}`, { method: 'PUT', body: { name: form.name.trim(), description: form.description.trim() } });
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
                    <button type="button" onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors" aria-label="Editar proyecto" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => deleteProject(id)} className="p-1.5 rounded-md hover:bg-red-50 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors" aria-label="Eliminar proyecto" title="Eliminar">
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
