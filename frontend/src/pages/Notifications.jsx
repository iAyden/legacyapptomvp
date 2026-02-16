import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';

export default function Notifications() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const data = await api('/api/notifications');
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async () => {
    try {
      await api('/api/notifications/read', { method: 'PUT' });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Notificaciones</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Mantente al dia con las actualizaciones</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} disabled={loading} className="btn-primary">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
          <button type="button" onClick={markRead} className="btn-secondary">
            <CheckCheck className="w-4 h-4" />
            Marcar leidas
          </button>
        </div>
      </div>

      {error && (
        <div className="card px-4 py-3 border-[hsl(var(--destructive))]/20 bg-[hsl(var(--destructive))]/5">
          <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-10 h-10 mx-auto text-[hsl(var(--muted-foreground))]/40 mb-3" />
            <p className="text-[hsl(var(--muted-foreground))]">No hay notificaciones nuevas</p>
          </div>
        ) : (
          <ul className="divide-y divide-[hsl(var(--border))]">
            {list.map((n) => (
              <li key={n.id || n._id} className="flex items-start gap-3 px-5 py-4 hover:bg-[hsl(var(--accent))] transition-colors">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-4 h-4 text-[hsl(var(--primary))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="badge bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]">{n.type}</span>
                    {n.createdAt && <span className="text-xs text-[hsl(var(--muted-foreground))]">{new Date(n.createdAt).toLocaleString()}</span>}
                  </div>
                  <p className="text-sm text-[hsl(var(--foreground))] mt-1">{n.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
