import { useAuth } from "../../hooks/useAuth.js";

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate">Welcome, {user?.name}</h1>
      <p className="text-slate-300 mt-2">
        Role: <span className="capitalize">{user?.role}</span>
      </p>
      <p className="text-slate-300 mt-4 text-sm">
        Role-specific widgets go here — active proposals for students, posted projects and
        pending milestones for clients, verification queue for university staff.
      </p>
    </div>
  );
}