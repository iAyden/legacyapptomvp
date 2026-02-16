import { useState, useEffect } from 'react';
import { api, downloadTasksCsv } from '../lib/api';

const STATUS_OPTIONS = ['Pendiente', 'En Progreso', 'Completada', 'Bloqueada', 'Cancelada'];
const PRIORITY_OPTIONS = ['Baja', 'Media', 'Alta', 'Crítica'];

export default function Reports() {
  const [reportType, setReportType] = useState('');
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    searchText: '',
    status: '',
    priority: '',
    projectId: '',
  });

  useEffect(() => {
    api('/api/projects')
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => {});
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">Generación de Reportes</h2>

      {/* Report type buttons - legacy: tasks / projects / users */}
      <section className="bg-white rounded-xl shadow p-4 md:p-6">
        <h3 className="font-medium text-slate-700 mb-3">Tipo de reporte</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadReport('tasks')}
            disabled={loading}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 text-sm"
          >
            Reporte de Tareas
          </button>
          <button
            type="button"
            onClick={() => loadReport('projects')}
            disabled={loading}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 text-sm"
          >
            Reporte de Proyectos
          </button>
          <button
            type="button"
            onClick={() => loadReport('users')}
            disabled={loading}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 text-sm"
          >
            Reporte de Usuarios
          </button>
        </div>
      </section>

      {/* Filters for CSV download - matching legacy (status / project / etc.) */}
      <section className="bg-white rounded-xl shadow p-4 md:p-6">
        <h3 className="font-medium text-slate-700 mb-3">Filtros para descargar CSV</h3>
        <p className="text-slate-500 text-sm mb-3">Opcional. Si no eliges filtros, se descargan todas las tareas.</p>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
          <input
            type="text"
            placeholder="Texto"
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
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Prioridad: todas</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={filters.projectId}
            onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Proyecto: todos</option>
            {projects.map((p) => (
              <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 text-sm"
          >
            Descargar CSV
          </button>
        </div>
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
      </section>

      <section className="bg-white rounded-xl shadow p-4">
        <h3 className="font-medium text-slate-700 mb-2">Reporte</h3>
        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : (
          <textarea
            readOnly
            value={reportText}
            rows={20}
            className="w-full px-3 py-2 border rounded-lg font-mono text-sm bg-slate-50"
          />
        )}
      </section>
    </div>
  );
}
