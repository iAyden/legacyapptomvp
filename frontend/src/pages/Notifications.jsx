import { useState, useEffect } from 'react';
import { api } from '../lib/api';

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
      <h2 className="text-xl font-semibold text-slate-800">Notificaciones</h2>

      <section className="bg-white rounded-xl shadow p-4 md:p-6">
        <div className="flex gap-2 mb-4">
          <button type="button" onClick={load} disabled={loading} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cargar Notificaciones</button>
          <button type="button" onClick={markRead} className="px-4 py-2 border rounded-lg hover:bg-slate-100">Marcar como Leídas</button>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500">No hay notificaciones nuevas</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {list.map((n) => (
              <li key={n.id || n._id} className="flex gap-2">
                <span className="text-slate-500">[{n.type}]</span>
                <span>{n.message}</span>
                <span className="text-slate-400">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
