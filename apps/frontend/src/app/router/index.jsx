import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./guards.jsx";

import LandingPage from "../../features/landing/LandingPage.jsx";
import LoginPage from "../../features/auth/LoginPage.jsx";
import RegisterPage from "../../features/auth/RegisterPage.jsx";
import ProjectListPage from "../../features/projects/ProjectListPage.jsx";
import ProjectDetailPage from "../../features/projects/ProjectDetailPage.jsx";
import PostProjectPage from "../../features/projects/PostProjectPage.jsx";
import DashboardPage from "../../features/workspace/DashboardPage.jsx";
import ContractDetailPage from "../../features/contracts/ContractDetailPage.jsx";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/projects" element={<ProjectListPage />} />
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
      <Route
        path="/projects/new"
        element={
          <ProtectedRoute allowedRoles={["client"]}>
            <PostProjectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contracts/:id"
        element={
          <ProtectedRoute>
            <ContractDetailPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
