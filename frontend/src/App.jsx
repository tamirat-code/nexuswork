import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ModulePlaceholder from "./pages/ModulePlaceholder";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import ContractsPage from "./pages/ContractsPage";
import ContractDetailPage from "./pages/ContractDetailPage";
import WalletPage from "./pages/WalletPage";
import PortfolioPage from "./pages/PortfolioPage";
import PostProjectPage from "./pages/PostProjectPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";
import DisputesPage from "./pages/DisputesPage";
import CategoriesPage from "./pages/CategoriesPage";
import ReportsPage from "./pages/ReportsPage";
export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/contracts" element={<ContractsPage />} />
      <Route path="/contracts/:id" element={<ContractDetailPage />} />

      <Route element={<ProtectedRoute />}>
  <Route element={<DashboardLayout />}>
  <Route path="/disputes" element={<DisputesPage />} />
<Route path="/categories" element={<CategoriesPage />} />
<Route path="/reports" element={<ReportsPage />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/projects" element={<ProjectsPage />} />
    <Route path="/projects/:id" element={<ProjectDetailPage />} />
    <Route path="/contracts" element={<ContractsPage />} />
    <Route path="/contracts/:id" element={<ContractDetailPage />} />
    <Route path="/portfolio" element={<PortfolioPage />} />
    <Route path="/wallet" element={<WalletPage />} />
    {/* remaining placeholders */}
    <Route path="/projects/new" element={<PostProjectPage />} />
    <Route path="/proposals" element={<ModulePlaceholder name="Bidding & Proposals" />} />
    <Route path="/learning" element={<ModulePlaceholder name="Learning & Training" />} />
    <Route path="/verifications" element={<ModulePlaceholder name="Student Verification" />} />
    <Route path="/analytics" element={<ModulePlaceholder name="University Analytics" />} />
    <Route path="/users" element={<UsersPage />} />
    <Route path="/disputes" element={<ModulePlaceholder name="Dispute Management" />} />
    <Route path="/categories" element={<ModulePlaceholder name="Category Management" />} />
    <Route path="/reports" element={<ModulePlaceholder name="Platform Reports" />} />
    <Route path="/settings" element={<SettingsPage />} />
  </Route>
</Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}