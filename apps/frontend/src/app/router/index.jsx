import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./guards.jsx";
import { ROLES } from "../../constants/roles.constants.js";

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
import ContractsPage from "../../features/contracts/ContractsPage.jsx";
import ContractDetailPage from "../../features/contracts/ContractDetailPage.jsx";
import WalletsPage from "../../features/wallets/WalletsPage.jsx";
import PaymentsPage from "../../features/payments/PaymentsPage.jsx";
import InvoicesPage from "../../features/invoices/InvoicesPage.jsx";
import ProposalsPage from "../../features/proposals/ProposalsPage.jsx";
import DisputesPage from "../../features/disputes/DisputesPage.jsx";
import NotificationsPage from "../../features/notifications/NotificationsPage.jsx";
import ChatPage from "../../features/chat/ChatPage.jsx";
import SettingsPage from "../../features/settings/SettingsPage.jsx";
import ProfilePage from "../../features/profile/ProfilePage.jsx";
import PortfoliosPage from "../../features/portfolios/PortfoliosPage.jsx";
import SkillsPage from "../../features/skills/SkillsPage.jsx";
import LearningPage from "../../features/learning/LearningPage.jsx";
import StudentsPage from "../../features/students/StudentsPage.jsx";
import ClientsPage from "../../features/clients/ClientsPage.jsx";
import UniversitiesPage from "../../features/universities/UniversitiesPage.jsx";
import AnalyticsPage from "../../features/analytics/AnalyticsPage.jsx";
import RecommendationPage from "../../features/recommendation/RecommendationPage.jsx";
import SearchPage from "../../features/search/SearchPage.jsx";
import AdminPage from "../../features/admin/AdminPage.jsx";
import TermsPage from "../../features/legal/TermsPage.jsx";
import PrivacyPage from "../../features/legal/PrivacyPage.jsx";
import NotFoundPage from "../../features/misc/NotFoundPage.jsx";

const protect = (element, allowedRoles) => (
  <ProtectedRoute allowedRoles={allowedRoles}>{element}</ProtectedRoute>
);

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/projects" element={<ProjectListPage />} />
      <Route path="/projects/new" element={protect(<PostProjectPage />, [ROLES.CLIENT])} />
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
      <Route path="/students" element={<StudentsPage />} />
      <Route path="/universities" element={<UniversitiesPage />} />
      <Route path="/search" element={<SearchPage />} />

      {/* Workspace */}
      <Route path="/dashboard" element={protect(<DashboardPage />)} />
      <Route path="/notifications" element={protect(<NotificationsPage />)} />
      <Route path="/chat" element={protect(<ChatPage />)} />
      <Route path="/chat/:conversationId" element={protect(<ChatPage />)} />
      <Route path="/proposals" element={protect(<ProposalsPage />)} />
      <Route path="/contracts" element={protect(<ContractsPage />)} />
      <Route path="/contracts/:id" element={protect(<ContractDetailPage />)} />
      <Route path="/disputes" element={protect(<DisputesPage />)} />
      <Route path="/wallet" element={protect(<WalletsPage />)} />
      <Route path="/payments" element={protect(<PaymentsPage />)} />
      <Route path="/invoices" element={protect(<InvoicesPage />)} />
      <Route path="/portfolios" element={protect(<PortfoliosPage />)} />
      <Route path="/skills" element={protect(<SkillsPage />)} />
      <Route path="/learning" element={protect(<LearningPage />)} />
      <Route path="/recommendations" element={protect(<RecommendationPage />)} />
      <Route path="/clients" element={protect(<ClientsPage />, [ROLES.UNIVERSITY_STAFF, ROLES.ADMIN])} />
      <Route path="/analytics" element={protect(<AnalyticsPage />, [ROLES.UNIVERSITY_STAFF, ROLES.ADMIN])} />
      <Route path="/admin" element={protect(<AdminPage />, [ROLES.ADMIN])} />
      <Route path="/settings" element={protect(<SettingsPage />)} />
      <Route path="/profile" element={protect(<ProfilePage />)} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
