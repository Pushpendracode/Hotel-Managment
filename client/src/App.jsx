import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Notifications from './pages/Notifications'
import Login from './pages/Login';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Residents from './pages/Residents';
import Maintenance from './pages/Maintenance';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Signup from './pages/Signup'


function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="rooms"       element={<Rooms />} />
            <Route path="residents"   element={<Residents />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="billing"     element={<Billing />} />
            <Route path="reports"     element={<ProtectedRoute roles={['admin']}><Reports /></ProtectedRoute>} />
            <Route path="users"       element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="/signup" element={<Signup />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}