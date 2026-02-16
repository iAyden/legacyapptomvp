import { useState } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { getUser, setToken, setUser } from '../lib/api';
import {
  CheckSquare,
  FolderKanban,
  MessageSquare,
  History,
  Bell,
  Search,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';

const NAV = [
  { to: '/tasks', label: 'Tareas', icon: CheckSquare },
  { to: '/projects', label: 'Proyectos', icon: FolderKanban },
  { to: '/comments', label: 'Comentarios', icon: MessageSquare },
  { to: '/history', label: 'Historial', icon: History },
  { to: '/notifications', label: 'Notificaciones', icon: Bell },
  { to: '/search', label: 'Busqueda', icon: Search },
  { to: '/reports', label: 'Reportes', icon: BarChart3 },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[hsl(var(--background))]">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]
          transform transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <Link to="/tasks" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-[hsl(var(--primary-foreground))]" />
            </div>
            <span className="font-semibold text-lg tracking-tight">TaskFlow</span>
          </Link>
          <button
            type="button"
            className="lg:hidden p-1 rounded-md hover:bg-white/10 transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--primary-foreground))]'
                      : 'text-[hsl(var(--sidebar-foreground))]/70 hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]'
                    }
                  `}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span>{label}</span>
                  {active && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-sm font-semibold text-[hsl(var(--primary-foreground))]">
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username || 'Usuario'}</p>
              <p className="text-xs text-[hsl(var(--sidebar-foreground))]/50">Conectado</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-lg hover:bg-white/10 text-[hsl(var(--sidebar-foreground))]/60 hover:text-[hsl(var(--sidebar-foreground))] transition-colors"
              aria-label="Cerrar sesion"
              title="Cerrar sesion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay when sidebar open on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-8 py-4 bg-[hsl(var(--background))]/80 backdrop-blur-md border-b border-[hsl(var(--border))]">
          <button
            type="button"
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5 text-[hsl(var(--foreground))]" />
          </button>

          {/* Breadcrumb / page title area - children can use this */}
          <div className="flex-1" />

          {/* User badge on desktop */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-xs font-semibold text-[hsl(var(--primary-foreground))]">
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-[hsl(var(--foreground))]">{user?.username || 'Usuario'}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
