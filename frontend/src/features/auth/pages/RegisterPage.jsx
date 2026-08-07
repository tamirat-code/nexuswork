import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../../services/api/auth.api";
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

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await registerUser({
        name,
        email,
        password,
        role,
      });

      loginUser(response.data);

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
        <h1 className="text-2xl font-bold mb-2">Register</h1>
        <p className="text-gray-600 mb-6">
          Create your Student Freelance Marketplace account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Role</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="student">Student</option>
              <option value="client">Client</option>
              <option value="university_staff">University Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <p className="text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}