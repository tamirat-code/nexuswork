import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./guards.jsx";

import LandingPage from "../../features/landing/LandingPage.jsx";
import LoginPage from "../../features/auth/LoginPage.jsx";
import RegisterPage from "../../features/auth/RegisterPage.jsx";
import ForgotPasswordPage from "../../features/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../../features/auth/ResetPasswordPage.jsx";
import VerifyEmailPage from "../../features/auth/VerifyEmailPage.jsx";
import ProjectListPage from "../../features/projects/ProjectListPage.jsx";
import ProjectDetailPage from "../../features/projects/ProjectDetailPage.jsx";
import PostProjectPage from "../../features/projects/PostProjectPage.jsx";
import DashboardPage from "../../features/workspace/DashboardPage.jsx";
import ContractDetailPage from "../../features/contracts/ContractDetailPage.jsx";
import WalletsPage from "../../features/wallets/WalletsPage.jsx";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
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
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <WalletsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}