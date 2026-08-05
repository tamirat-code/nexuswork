import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import FormError from "../../components/forms/FormError.jsx";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 px-6">
      <h1 className="text-2xl font-semibold mb-6">Create an account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input placeholder="Full name" value={form.name} onChange={update("name")} required />
        <Input type="email" placeholder="Email" value={form.email} onChange={update("email")} required />
        <Input type="password" placeholder="Password" value={form.password} onChange={update("password")} required />
        <select className="w-full border rounded px-3 py-2 text-sm" value={form.role} onChange={update("role")}>
          <option value="student">Student Freelancer</option>
          <option value="client">Client</option>
        </select>
        <FormError message={error} />
        <Button type="submit" className="w-full">
          Sign up
        </Button>
      </form>
    </div>
  );
}
