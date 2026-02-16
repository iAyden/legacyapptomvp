import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { Search, X, Loader2 } from 'lucide-react';

export default function TaskSearchInput({ onSelect, selectedTask }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  const searchTasks = useCallback(async (text) => {
    if (!text.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setSearching(true);
    try {
      const data = await api(`/api/tasks?searchText=${encodeURIComponent(text.trim())}`);
      setResults(Array.isArray(data) ? data : []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (selectedTask) {
      onSelect(null);
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchTasks(value), 300);
  };

  const handleSelect = (task) => {
    setQuery(task.title);
    setOpen(false);
    setResults([]);
    onSelect(task);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    onSelect(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const priorityColors = {
    'Baja': 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
    'Media': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Alta': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Crítica': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const statusColors = {
    'Pendiente': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'En Progreso': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Completada': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Bloqueada': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Cancelada': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0 && !selectedTask) setOpen(true); }}
          className="input-field pl-9 pr-9"
          placeholder="Buscar tarea por nombre..."
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] animate-spin" />
        )}
        {!searching && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg">
          {results.map((task) => (
            <li key={task._id || task.id}>
              <button
                type="button"
                onClick={() => handleSelect(task)}
                className="w-full text-left px-3 py-2.5 hover:bg-[hsl(var(--secondary))] transition-colors flex flex-col gap-1 border-b border-[hsl(var(--border))] last:border-b-0"
              >
                <span className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                  {task.title}
                </span>
                <div className="flex items-center gap-2">
                  {task.status && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${statusColors[task.status] || ''}`}>
                      {task.status}
                    </span>
                  )}
                  {task.priority && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColors[task.priority] || ''}`}>
                      {task.priority}
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !searching && results.length === 0 && query.trim() && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg p-4 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No se encontraron tareas</p>
        </div>
      )}
    </div>
  );
}
