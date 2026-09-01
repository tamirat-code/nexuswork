import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, GuestOnlyRoute } from "./guards.jsx";
import { ROLES } from "../../constants/roles.constants.js";

import LandingPage from "../../features/landing/LandingPage.jsx";
const LoginPage = lazy(() => import("../../features/auth/LoginPage.jsx"));
const RegisterPage = lazy(() => import("../../features/auth/RegisterPage.jsx"));
const ForgotPasswordPage = lazy(() => import("../../features/auth/ForgotPasswordPage.jsx"));
const ResetPasswordPage = lazy(() => import("../../features/auth/ResetPasswordPage.jsx"));
const VerifyEmailPage = lazy(() => import("../../features/auth/VerifyEmailPage.jsx"));
const MfaSetupPage = lazy(() => import("../../features/auth/MfaSetupPage.jsx"));
const MfaVerifyPage = lazy(() => import("../../features/auth/MfaVerifyPage.jsx"));
const ProjectListPage = lazy(() => import("../../features/projects/ProjectListPage.jsx"));
const ProjectDetailPage = lazy(() => import("../../features/projects/ProjectDetailPage.jsx"));
const PostProjectPage = lazy(() => import("../../features/projects/PostProjectPage.jsx"));
const DashboardPage = lazy(() => import("../../features/workspace/DashboardPage.jsx"));
const ContractsPage = lazy(() => import("../../features/contracts/ContractsPage.jsx"));
const ContractDetailPage = lazy(() => import("../../features/contracts/ContractDetailPage.jsx"));
const WalletsPage = lazy(() => import("../../features/wallets/WalletsPage.jsx"));
const PaymentsPage = lazy(() => import("../../features/payments/PaymentsPage.jsx"));
const PaymentCompletePage = lazy(() => import("../../features/payments/PaymentCompletePage.jsx"));
const InvoicesPage = lazy(() => import("../../features/invoices/InvoicesPage.jsx"));
const ProposalsPage = lazy(() => import("../../features/proposals/ProposalsPage.jsx"));
const DisputesPage = lazy(() => import("../../features/disputes/DisputesPage.jsx"));
const NotificationsPage = lazy(() => import("../../features/notifications/NotificationsPage.jsx"));
const ChatPage = lazy(() => import("../../features/chat/ChatPage.jsx"));
const SettingsPage = lazy(() => import("../../features/settings/SettingsPage.jsx"));
const ProfilePage = lazy(() => import("../../features/profile/ProfilePage.jsx"));
const PortfoliosPage = lazy(() => import("../../features/portfolios/PortfoliosPage.jsx"));
const SkillsPage = lazy(() => import("../../features/skills/SkillsPage.jsx"));
const LearningPage = lazy(() => import("../../features/learning/LearningPage.jsx"));
const StudentsPage = lazy(() => import("../../features/students/StudentsPage.jsx"));
const StudentProfilePage = lazy(() => import("../../features/students/ProfilePage.jsx"));
const ClientsPage = lazy(() => import("../../features/clients/ClientsPage.jsx"));
const UniversitiesPage = lazy(() => import("../../features/universities/UniversitiesPage.jsx"));
const CredentialVerifyPage = lazy(() => import("../../features/verifications/CredentialVerifyPage.jsx"));
const AnalyticsPage = lazy(() => import("../../features/analytics/AnalyticsPage.jsx"));
const RecommendationPage = lazy(() => import("../../features/recommendation/RecommendationPage.jsx"));
const SearchPage = lazy(() => import("../../features/search/SearchPage.jsx"));
const AdminPage = lazy(() => import("../../features/admin/AdminPage.jsx"));
const TermsPage = lazy(() => import("../../features/legal/TermsPage.jsx"));
const PrivacyPage = lazy(() => import("../../features/legal/PrivacyPage.jsx"));
const NotFoundPage = lazy(() => import("../../features/misc/NotFoundPage.jsx"));
const MeetingPage = lazy(() => import("../../features/meetings/MeetingPage.jsx"));
const MeetingsListPage = lazy(() => import("../../features/meetings/MeetingsListPage.jsx"));

const protect = (element, allowedRoles) => (
  <ProtectedRoute allowedRoles={allowedRoles}>{element}</ProtectedRoute>
);

const guestOnly = (element) => <GuestOnlyRoute>{element}</GuestOnlyRoute>;

function RouteLoading() {
  return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-300" role="status">Loading page…</div>;
}

export default function AppRouter() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={guestOnly(<LoginPage />)} />
      <Route path="/register" element={guestOnly(<RegisterPage />)} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/mfa/setup" element={<MfaSetupPage />} />
      <Route path="/mfa/verify" element={<MfaVerifyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/projects" element={<ProjectListPage />} />
      <Route path="/projects/new" element={protect(<PostProjectPage />, [ROLES.CLIENT])} />
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
      <Route path="/students" element={<StudentsPage />} />
      <Route path="/profile/:id" element={<StudentProfilePage />} />
      <Route path="/universities" element={<UniversitiesPage />} />
      <Route path="/verifications" element={protect(<UniversitiesPage />, [ROLES.UNIVERSITY_STAFF, ROLES.ADMIN])} />
      <Route path="/verify-credential" element={<CredentialVerifyPage />} />
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
      {/* Backwards-compatible redirects for legacy Stripe Connect callback URLs */}
      <Route path="/wallet/connect/done" element={<Navigate to="/wallet?connect=done" replace />} />
      <Route path="/wallet/connect/refresh" element={<Navigate to="/wallet?connect=refresh" replace />} />
      <Route path="/payments" element={protect(<PaymentsPage />)} />
      <Route path="/payments/complete" element={protect(<PaymentCompletePage />)} />
      <Route path="/invoices" element={protect(<InvoicesPage />)} />
      <Route path="/portfolios" element={protect(<PortfoliosPage />)} />
      <Route path="/skills" element={protect(<SkillsPage />)} />
      <Route path="/learning" element={protect(<LearningPage />)} />
      <Route path="/recommendations" element={protect(<RecommendationPage />)} />
      <Route path="/clients" element={protect(<ClientsPage />, [ROLES.UNIVERSITY_STAFF, ROLES.ADMIN])} />
      <Route path="/analytics" element={protect(<AnalyticsPage />, [ROLES.UNIVERSITY_STAFF, ROLES.ADMIN])} />
      <Route path="/admin" element={protect(<AdminPage />, [ROLES.ADMIN])} />
      <Route path="/admin/users" element={protect(<AdminPage />, [ROLES.ADMIN])} />
      <Route path="/admin/disputes" element={protect(<AdminPage />, [ROLES.ADMIN])} />
      <Route path="/admin/analytics" element={protect(<AdminPage />, [ROLES.ADMIN])} />
      <Route path="/settings" element={protect(<SettingsPage />)} />
      <Route path="/profile" element={protect(<ProfilePage />)} />
      <Route path="/meetings/:meetingId" element={protect(<MeetingPage />)} />
      <Route path="/meetings" element={protect(<MeetingsListPage />)} />

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
