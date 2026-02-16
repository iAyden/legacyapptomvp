import { useState } from 'react';
import { api } from '../lib/api';
import { MessageSquare, Send, RefreshCw } from 'lucide-react';
import TaskSearchInput from '../components/TaskSearchInput';

export default function Comments() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadComments = async () => {
    if (!selectedTask) { setError('Selecciona una tarea primero'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await api(`/api/comments/task/${selectedTask._id || selectedTask.id}`);
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const COMMENT_MIN = 1;
  const COMMENT_MAX = 500;

  const addComment = async (e) => {
    e.preventDefault();
    if (!selectedTask) { setError('Selecciona una tarea primero'); return; }
    if (!commentText.trim()) { setError('El comentario no puede estar vacio'); return; }
    if (commentText.trim().length < COMMENT_MIN) { setError(`El comentario debe tener al menos ${COMMENT_MIN} caracteres`); return; }
    if (commentText.length > COMMENT_MAX) { setError(`El comentario no puede superar ${COMMENT_MAX} caracteres`); return; }
    setError('');
    try {
      await api('/api/comments', { method: 'POST', body: { taskId: selectedTask._id || selectedTask.id, commentText: commentText.trim() } });
      setCommentText('');
      loadComments();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Comentarios</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Gestiona comentarios de tareas</p>
      </div>

      <div className="card p-5">
        <form onSubmit={addComment} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Tarea</label>
            <TaskSearchInput onSelect={setSelectedTask} selectedTask={selectedTask} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Comentario</label>
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3} className="input-field resize-none" required placeholder="Escribe tu comentario..." maxLength={COMMENT_MAX} />
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 text-right">{commentText.length}/{COMMENT_MAX}</p>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary"><Send className="w-4 h-4" />Agregar</button>
            <button type="button" onClick={loadComments} disabled={loading} className="btn-secondary"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Cargar</button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-[hsl(var(--destructive))]">{error}</p>}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
          <h3 className="font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comentarios
          </h3>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-[hsl(var(--muted-foreground))] text-center py-8">Busca una tarea por nombre y pulsa Cargar</p>
          ) : (
            <ul className="space-y-4">
              {comments.map((c) => (
                <li key={c.id || c._id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center text-xs font-medium text-[hsl(var(--secondary-foreground))] shrink-0">
                    {(c.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">{c.username || 'Usuario'}</span>
                      {c.createdAt && <span className="text-xs text-[hsl(var(--muted-foreground))]">{new Date(c.createdAt).toLocaleString()}</span>}
                    </div>
                    <p className="text-sm text-[hsl(var(--foreground))]/80 mt-1">{c.commentText}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
