import { useAuth } from "../../context/AuthContext";
import StudentDashboard from "./StudentDashboard";
import ClientDashboard from "./ClientDashboard";
import UniversityDashboard from "./UniversityDashboard";
import AdminDashboard from "./AdminDashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  switch (user?.role) {
    case "client": return <ClientDashboard />;
    case "university_staff": return <UniversityDashboard />;
    case "admin": return <AdminDashboard />;
    default: return <StudentDashboard />;
  }
}