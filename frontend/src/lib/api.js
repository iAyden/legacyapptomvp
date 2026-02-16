const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const getToken = () => localStorage.getItem('token');

export async function api(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const headers = {
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body != null && typeof options.body === 'object' && !(options.body instanceof FormData) && !(options.body instanceof Blob)) {
    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body != null && headers['Content-Type'] === 'application/json' ? JSON.stringify(options.body) : options.body,
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    throw new Error('No autorizado');
  }
  const contentType = res.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText || 'Error');
    return data;
  }
  if (!res.ok) throw new Error(res.statusText || 'Error');
  return res;
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export function setUser(user) {
  if (user) localStorage.setItem('user', JSON.stringify(user));
  else localStorage.removeItem('user');
}

export function getUser() {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}

/** GET /api/tasks.csv with optional query params; returns blob for download */
export async function downloadTasksCsv(params = {}) {
  const token = getToken();
  const qs = new URLSearchParams(params).toString();
  const url = `${API_URL}/api/tasks.csv${qs ? '?' + qs : ''}`;
  const res = await fetch(url, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
  if (!res.ok) throw new Error('Error al descargar CSV');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tasks.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
