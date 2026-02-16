import { useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { getUser, setToken, setUser } from '../lib/api';

const NAV = [
  { to: '/tasks', label: 'Tareas' },
  { to: '/projects', label: 'Proyectos' },
  { to: '/comments', label: 'Comentarios' },
  { to: '/history', label: 'Historial' },
  { to: '/notifications', label: 'Notificaciones' },
  { to: '/search', label: 'Búsqueda' },
  { to: '/reports', label: 'Reportes' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getUser();
  const navigate = useNavigate();

  const logout = () => {
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Topbar - mobile first */}
      <header className="bg-slate-800 text-white flex items-center justify-between px-4 py-3 md:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-700"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/tasks" className="font-semibold text-lg">Task Manager</Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-300 text-sm">Usuario: <strong>{user?.username || ''}</strong></span>
          <button
            type="button"
            onClick={logout}
            className="px-3 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-sm"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Sidebar - collapsible on mobile */}
      <aside
        className={`
          bg-slate-700 text-white w-56 shrink-0 flex flex-col
          fixed md:static inset-y-0 left-0 z-40 pt-14 md:pt-0
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <nav className="p-4 space-y-1">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="block px-4 py-2 rounded-lg hover:bg-slate-600"
              onClick={() => setSidebarOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Overlay when sidebar open on mobile */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content - on mobile add top padding so content is below topbar when sidebar hidden */}
      <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
