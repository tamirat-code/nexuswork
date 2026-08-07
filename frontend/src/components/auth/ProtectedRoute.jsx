import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ roles }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // If not logged in, redirect to login page (and remember where they wanted to go)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified but user doesn't have the right role, redirect to dashboard
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise, render the child route
  return <Outlet />;
}