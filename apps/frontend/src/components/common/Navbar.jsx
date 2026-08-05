import { Link } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <Link to="/" className="font-semibold text-lg">
        NexusWork
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link to="/projects">Browse Projects</Link>
        {user?.role === "client" && <Link to="/projects/new">Post a Project</Link>}
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={logout} className="text-red-600">
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
