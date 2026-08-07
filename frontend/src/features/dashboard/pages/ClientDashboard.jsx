import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";

export default function ClientDashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-md rounded-xl p-8">
          <h1 className="text-2xl font-bold mb-2">Client Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Welcome, {user?.name}. This is the client workspace.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <h2 className="font-semibold">Post Project</h2>
              <p className="text-gray-600">Create a new project.</p>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="font-semibold">Proposals</h2>
              <p className="text-gray-600">Review student proposals.</p>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="font-semibold">Contracts</h2>
              <p className="text-gray-600">Manage active contracts.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/"
              className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Back Home
            </Link>

            <button
              onClick={handleLogout}
              className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}