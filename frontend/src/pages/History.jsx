import { useState } from 'react';
import { api } from '../lib/api';
import { History as HistoryIcon, RefreshCw, List } from 'lucide-react';

export default function History() {
  const [taskId, setTaskId] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('task');

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
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Historial</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Registro de cambios en las tareas</p>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">ID Tarea</label>
            <input type="text" value={taskId} onChange={(e) => setTaskId(e.target.value)} className="input-field w-40" placeholder="ID" />
          </div>
          <button type="button" onClick={loadTaskHistory} disabled={loading} className="btn-primary">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Cargar Historial
          </button>
          <button type="button" onClick={loadAllHistory} disabled={loading} className="btn-secondary">
            <List className="w-4 h-4" />
            Todo el Historial
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-[hsl(var(--destructive))]">{error}</p>}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
          <h3 className="font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <HistoryIcon className="w-4 h-4" />
            {mode === 'all' ? 'Historial completo' : `Historial tarea #${taskId || '?'}`}
          </h3>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-[hsl(var(--muted-foreground))] text-center py-8">No hay historial</p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id || entry._id} className="relative pl-5 border-l-2 border-[hsl(var(--border))]">
                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-[hsl(var(--primary))]" />
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">{entry.action}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
                    {entry.username || 'Desconocido'}: {entry.oldValue || '(vacio)'} {'-->'} {entry.newValue || '(vacio)'}
                  </p>
                  {entry.timestamp && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]/60 mt-1">{new Date(entry.timestamp).toLocaleString()}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
