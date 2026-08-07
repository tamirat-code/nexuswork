import { createBrowserRouter } from "react-router-dom";

import HomePage from "../pages/HomePage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";

import ProtectedRoute from "./ProtectedRoute";

import StudentDashboard from "../features/dashboard/pages/StudentDashboard";
import ClientDashboard from "../features/dashboard/pages/ClientDashboard";
import UniversityDashboard from "../features/dashboard/pages/UniversityDashboard";
import AdminDashboard from "../features/dashboard/pages/AdminDashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },

  {
    element: <ProtectedRoute allowedRoles={["student"]} />,
    children: [
      {
        path: "/student/dashboard",
        element: <StudentDashboard />,
      },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={["client"]} />,
    children: [
      {
        path: "/client/dashboard",
        element: <ClientDashboard />,
      },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={["university_staff"]} />,
    children: [
      {
        path: "/university/dashboard",
        element: <UniversityDashboard />,
      },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={["admin"]} />,
    children: [
      {
        path: "/admin/dashboard",
        element: <AdminDashboard />,
      },
    ],
  },
]);

export default router;