import { useState } from 'react';
import { api } from '../lib/api';

export default function History() {
  const [taskId, setTaskId] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('task'); // 'task' | 'all'

  const loadTaskHistory = async () => {
    if (!taskId.trim()) { setError('ID de tarea requerido'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await api(`/api/history/task/${taskId.trim()}`);
      setEntries(Array.isArray(data) ? data : []);
      setMode('task');
    } catch (e) {
      setError(e.message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllHistory = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api('/api/history');
      setEntries(Array.isArray(data) ? data : []);
      setMode('all');
    } catch (e) {
      setError(e.message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">Historial de Cambios</h2>

      <section className="bg-white rounded-xl shadow p-4 md:p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-slate-600 mb-1">ID Tarea</label>
            <input
              type="text"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-32 px-3 py-2 border rounded-lg"
            />
          </div>
          <button type="button" onClick={loadTaskHistory} disabled={loading} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cargar Historial</button>
          <button type="button" onClick={loadAllHistory} disabled={loading} className="px-4 py-2 border rounded-lg hover:bg-slate-100">Cargar Todo el Historial</button>
        </div>
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
      </section>

      <section className="bg-white rounded-xl shadow p-4">
        <h3 className="font-medium text-slate-700 mb-2">{mode === 'all' ? 'Historial completo' : `Historial tarea #${taskId || '?'}`}</h3>
        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : entries.length === 0 ? (
          <p className="text-slate-500">No hay historial</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {entries.map((e) => (
              <li key={e.id || e._id} className="border-b border-slate-100 pb-2">
                <span className="text-slate-600">{e.timestamp ? new Date(e.timestamp).toLocaleString() : ''} - {e.action}</span>
                <br />
                <span className="text-slate-500">Usuario: {e.username || 'Desconocido'}</span>
                <br />
                Antes: {e.oldValue || '(vacío)'} → Después: {e.newValue || '(vacío)'}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
