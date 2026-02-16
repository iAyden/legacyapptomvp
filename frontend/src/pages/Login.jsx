import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { api, setToken, setUser, isAuthenticated } from '../lib/api';
import { CheckSquare, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated()) return <Navigate to="/tasks" replace />;

  const USERNAME_MIN = 3;
  const USERNAME_MAX = 30;
  const PASSWORD_MIN = 4;

  const validateAuthForm = () => {
    if (!username.trim()) { setError('El usuario es requerido'); return false; }
    if (username.trim().length < USERNAME_MIN) { setError(`El usuario debe tener al menos ${USERNAME_MIN} caracteres`); return false; }
    if (username.trim().length > USERNAME_MAX) { setError(`El usuario no puede superar ${USERNAME_MAX} caracteres`); return false; }
    if (!password) { setError('La contrasena es requerida'); return false; }
    if (password.length < PASSWORD_MIN) { setError(`La contrasena debe tener al menos ${PASSWORD_MIN} caracteres`); return false; }
    if (/\s/.test(username.trim())) { setError('El usuario no puede contener espacios'); return false; }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateAuthForm()) return;
    setLoading(true);
    try {
      const { token, user } = await api('/api/auth/login', {
        method: 'POST',
        body: { username: username.trim(), password },
      });
      setToken(token);
      setUser(user);
      navigate('/tasks', { replace: true });
    } catch (err) {
      setError(err.message || 'Credenciales invalidas');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateAuthForm()) return;
    setLoading(true);
    try {
      const { token, user } = await api('/api/auth/register', {
        method: 'POST',
        body: { username: username.trim(), password },
      });
      setToken(token);
      setUser(user);
      navigate('/tasks', { replace: true });
    } catch (err) {
      setError(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[hsl(var(--background))]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center mb-4">
            <CheckSquare className="w-6 h-6 text-[hsl(var(--primary-foreground))]" />
          </div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">TaskFlow</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Gestiona tus tareas de forma eficiente</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-6">
            {mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
          </h2>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                autoComplete="username"
                placeholder="Tu nombre de usuario"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">Contrasena</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Tu contrasena"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/20 rounded-[var(--radius)]">
                <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login'
                ? (loading ? 'Entrando...' : 'Entrar')
                : (loading ? 'Registrando...' : 'Registrarse')
              }
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[hsl(var(--border))] text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {mode === 'login' ? (
                <>
                  No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); }}
                    className="font-medium text-[hsl(var(--primary))] hover:underline"
                  >
                    Registrarse
                  </button>
                </>
              ) : (
                <>
                  Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className="font-medium text-[hsl(var(--primary))] hover:underline"
                  >
                    Entrar
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
