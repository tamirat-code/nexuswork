import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../../services/api/auth.api";
import { useAuth } from "../../../app/providers/AuthProvider";

function getDashboardPath(role) {
  switch (role) {
    case "student":
      return "/student/dashboard";
    case "client":
      return "/client/dashboard";
    case "university_staff":
      return "/university/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/";
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginUser: login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser({ email, password });

      login(response.data);

      navigate(getDashboardPath(response.data.user.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Login</h1>
        <p className="text-gray-600 mb-6">
          Login to your Student Freelance Marketplace account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="student@test.com"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="123456"
              required
            />
          </div>

          {error && <p className="text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-gray-600">
          Do not have an account?{" "}
          <Link to="/register" className="text-blue-600">
            Register
          </Link>
        </p>

        <div className="mt-6 border rounded-lg p-4 bg-gray-50 text-sm">
          <p className="font-semibold mb-2">Mock Accounts</p>
          <p>student@test.com / 123456</p>
          <p>client@test.com / 123456</p>
          <p>university@test.com / 123456</p>
          <p>admin@test.com / 123456</p>
        </div>
      </div>
    </div>
  );
}