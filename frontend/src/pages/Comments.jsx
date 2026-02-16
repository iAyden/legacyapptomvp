import { useState } from 'react';
import { api } from '../lib/api';

export default function Comments() {
  const [taskId, setTaskId] = useState('');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadComments = async () => {
    if (!taskId.trim()) { setError('ID de tarea requerido'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await api(`/api/comments/task/${taskId.trim()}`);
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!taskId.trim()) { setError('ID de tarea requerido'); return; }
    if (!commentText.trim()) { setError('El comentario no puede estar vacío'); return; }
    setError('');
    try {
      await api('/api/comments', { method: 'POST', body: { taskId: taskId.trim(), commentText: commentText.trim() } });
      setCommentText('');
      loadComments();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">Comentarios de Tareas</h2>

      <section className="bg-white rounded-xl shadow p-4 md:p-6">
        <form onSubmit={addComment} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm text-slate-600 mb-1">ID Tarea</label>
            <input
              type="text"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Comentario</label>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Agregar Comentario</button>
            <button type="button" onClick={loadComments} disabled={loading} className="px-4 py-2 border rounded-lg hover:bg-slate-100">Cargar Comentarios</button>
          </div>
        </form>
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
      </section>

      <section className="bg-white rounded-xl shadow p-4">
        <h3 className="font-medium text-slate-700 mb-2">Comentarios</h3>
        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : comments.length === 0 ? (
          <p className="text-slate-500">Ingresa un ID de tarea y pulsa Cargar Comentarios</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {comments.map((c) => (
              <li key={c.id || c._id} className="border-b border-slate-100 pb-2">
                <span className="text-slate-500">[{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}] {c.username || 'Usuario'}: </span>
                {c.commentText}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
