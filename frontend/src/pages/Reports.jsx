import { useState, useEffect } from 'react';
import { api, downloadTasksCsv } from '../lib/api';
import { BarChart3, Download, FileText, Users, FolderKanban } from 'lucide-react';

const STATUS_OPTIONS = ['Pendiente', 'En Progreso', 'Completada', 'Bloqueada', 'Cancelada'];
const PRIORITY_OPTIONS = ['Baja', 'Media', 'Alta', 'Critica'];

export default function Reports() {
  const [reportType, setReportType] = useState('');
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ searchText: '', status: '', priority: '', projectId: '' });

  useEffect(() => {
    api('/api/projects').then((data) => setProjects(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const loadReport = async (type) => {
    setReportType(type);
    setError('');
    setLoading(true);
    try {
      const data = await api(`/api/reports/${type}`);
      setReportText(data.report || '');
    } catch (e) {
      setError(e.message);
      setReportText('');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    setError('');
    const params = {};
    if (filters.searchText?.trim()) params.searchText = filters.searchText.trim();
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.projectId) params.projectId = filters.projectId;
    try {
      await downloadTasksCsv(params);
    } catch (e) {
      setError(e.message);
    }
  };

  const reportButtons = [
    { type: 'tasks', label: 'Tareas', icon: FileText },
    { type: 'projects', label: 'Proyectos', icon: FolderKanban },
    { type: 'users', label: 'Usuarios', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Reportes</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Genera reportes y descarga datos</p>
      </div>

      {/* Report type */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Tipo de reporte
        </h3>
        <div className="flex flex-wrap gap-2">
          {reportButtons.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => loadReport(type)}
              disabled={loading}
              className={`btn-secondary ${reportType === type ? 'ring-2 ring-[hsl(var(--ring))]' : ''}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* CSV download */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-1 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Descargar CSV
        </h3>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">Opcional: filtra antes de descargar.</p>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
          <input type="text" placeholder="Texto" value={filters.searchText} onChange={(e) => setFilters((f) => ({ ...f, searchText: e.target.value }))} className="input-field" />
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="input-field">
            <option value="">Estado: todos</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))} className="input-field">
            <option value="">Prioridad: todas</option>
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.projectId} onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))} className="input-field">
            <option value="">Proyecto: todos</option>
            {projects.map((p) => <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>)}
          </select>
          <button type="button" onClick={handleDownloadCsv} className="btn-primary">
            <Download className="w-4 h-4" />
            Descargar
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-[hsl(var(--destructive))]">{error}</p>}
      </div>

      {/* Report output */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
          <h3 className="font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Reporte {reportType ? `- ${reportType}` : ''}
          </h3>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <textarea
              readOnly
              value={reportText}
              rows={16}
              className="input-field font-mono text-xs resize-none bg-[hsl(var(--secondary))]"
              placeholder="Selecciona un tipo de reporte para ver los resultados..."
            />
          )}
        </div>
      </div>
    </div>
  );
}
