import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { api, setToken, setUser, isAuthenticated } from '../lib/api';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated()) return <Navigate to="/tasks" replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Usuario y contraseña requeridos');
      return;
    }
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
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Usuario y contraseña requeridos');
      return;
    }
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-xl font-semibold text-center text-slate-800 mb-6">Task Manager</h1>
        <h2 className="text-lg font-medium text-slate-700 mb-4">
          {mode === 'login' ? 'Login' : 'Registro'}
        </h2>
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-slate-600">
          {mode === 'login' ? (
            <>
              ¿No tienes cuenta?{' '}
              <button type="button" onClick={() => { setMode('register'); setError(''); }} className="text-slate-800 font-medium hover:underline">
                Registrarse
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{' '}
              <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-slate-800 font-medium hover:underline">
                Entrar
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
