import { useState } from 'react';
import { api, downloadTasksCsv } from '../lib/api';

export default function Reports() {
  const [reportType, setReportType] = useState('');
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    try {
      await downloadTasksCsv();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">Generación de Reportes</h2>

      <section className="bg-white rounded-xl shadow p-4 md:p-6">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => loadReport('tasks')} disabled={loading} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Reporte de Tareas</button>
          <button type="button" onClick={() => loadReport('projects')} disabled={loading} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Reporte de Proyectos</button>
          <button type="button" onClick={() => loadReport('users')} disabled={loading} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Reporte de Usuarios</button>
          <button type="button" onClick={handleDownloadCsv} className="px-4 py-2 border rounded-lg hover:bg-slate-100">Exportar a CSV</button>
        </div>
        <p className="mt-2 text-slate-500 text-sm">CSV descarga todas las tareas (mismo esquema que legacy).</p>
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
