import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Residents from "./pages/Residents";
import Maintenance from "./pages/Maintenance";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Notifications from "./pages/Notifications";

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />

        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ================= PROTECTED ROUTES ================= */}

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            <Route path="rooms" element={<Rooms />} />

            <Route path="residents" element={<Residents />} />

            <Route path="maintenance" element={<Maintenance />} />

            <Route path="billing" element={<Billing />} />

            <Route
              path="reports"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route
              path="users"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <Users />
                </ProtectedRoute>
              }
            />

            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* ================= UNKNOWN ROUTES ================= */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}