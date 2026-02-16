import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { isAuthenticated } from './lib/api';
import Layout from './components/Layout';
import Login from './pages/Login';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import Comments from './pages/Comments';
import History from './pages/History';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import Reports from './pages/Reports';

function PrivateRoute({ children }) {
  const [ok, setOk] = useState(null);
  useEffect(() => {
    setOk(isAuthenticated());
  }, []);
  useEffect(() => {
    const onAuth = () => setOk(isAuthenticated());
    window.addEventListener('auth-change', onAuth);
    return () => window.removeEventListener('auth-change', onAuth);
  }, []);
  if (ok === null) return <div className="p-8 text-center">Cargando...</div>;
  return ok ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/tasks" replace />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="projects" element={<Projects />} />
        <Route path="comments" element={<Comments />} />
        <Route path="history" element={<History />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="search" element={<Search />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
