import { Navigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider.jsx";

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, token } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function GuestOnlyRoute({ children }) {
  const { token } = useAuth();
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}
