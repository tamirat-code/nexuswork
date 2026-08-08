import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../components/notifications/ToastProvider.jsx";
import AuthShell from "./components/AuthShell.jsx";
import GoogleAuthButton from "./components/GoogleAuthButton.jsx";
import RolePicker from "./components/RolePicker.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email";
    if (form.password.length < 8) next.password = "At least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({ ...form, role });
      show("Account created. Check your email to verify it.");
      navigate("/dashboard");
    } catch (err) {
      show(err.message, { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleCredential(credential, err) {
    if (err) return show(err.message, { variant: "error" });
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle(credential, role);
      show(result.isNewUser ? "Account created with Google." : "Welcome back.");
      navigate("/dashboard");
    } catch (err) {
      show(err.message, { variant: "error" });
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      subtitle="Join as a student looking for work, or a client with work to post."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brass hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <RolePicker value={role} onChange={setRole} />

        <GoogleAuthButton onCredential={handleGoogleCredential} disabled={googleLoading} />

        <div className="flex items-center gap-3 text-xs text-slate-300">
          <div className="h-px flex-1 bg-ink-300" />
          or with email
          <div className="h-px flex-1 bg-ink-300" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input label="Full name" value={form.name} onChange={update("name")} error={errors.name} autoComplete="name" />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={update("email")}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={update("password")}
            error={errors.password}
            hint="At least 8 characters"
            autoComplete="new-password"
          />
          <Button type="submit" loading={submitting} className="w-full" size="lg">
            Create account
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}