import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../../services/api/auth.api.js";
import AuthShell from "./components/AuthShell.jsx";
import Input from "../../components/ui/Input.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import Button from "../../components/ui/Button.jsx";

function passwordIssue(password) {
  if (password.length < 8) return "At least 8 characters";
  if (!/[a-z]/.test(password)) return "Include at least one lowercase letter";
  if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter";
  if (!/[0-9]/.test(password)) return "Include at least one number";
  return null;
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <AuthShell eyebrow="Password reset" title="This link is missing a token">
        <p className="text-sm text-slate-300 mb-6">
          Make sure you opened the full link from your email, or request a new one.
        </p>
        <Link to="/forgot-password" className="text-sm font-semibold text-brass hover:underline">
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  function validate() {
    const next = {};
    const pwIssue = passwordIssue(password);
    if (pwIssue) next.password = pwIssue;
    if (confirm !== password) next.confirm = "Passwords don't match";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setErrors({ password: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AuthShell eyebrow="Success" title="Password reset">
        <p className="text-sm text-slate-300">Redirecting you to log in…</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Password reset" title="Choose a new password">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <PasswordInput
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="At least 8 characters, with upper, lower, and a number"
          autoComplete="new-password"
        />
        <PasswordInput
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          autoComplete="new-password"
        />
        <Button type="submit" loading={submitting} className="w-full" size="lg">
          Reset password
        </Button>
      </form>
    </AuthShell>
  );
}
