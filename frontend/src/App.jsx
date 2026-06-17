// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FormInputPage from './pages/FormInputPage';
import RekapPage from './pages/RekapPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminMasterPage from './pages/admin/AdminMasterPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Layout
import AppLayout from './components/layout/AppLayout';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0e1a', color: '#f1f5f9' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/form-input" element={
          <ProtectedRoute allowedRoles={['admin', 'korlap', 'pml']}>
            <FormInputPage />
          </ProtectedRoute>
        } />
        <Route path="/rekap" element={
          <ProtectedRoute allowedRoles={['admin', 'korlap', 'pml']}>
            <RekapPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsersPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/master" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminMasterPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettingsPage />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
