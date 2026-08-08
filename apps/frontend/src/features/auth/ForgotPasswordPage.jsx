import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/api/auth.api.js";
import AuthShell from "./components/AuthShell.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { SealMark } from "./components/AuthShell.jsx";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthShell eyebrow="Check your inbox" title="Reset link sent">
        <div className="rounded-card border border-escrow bg-escrow-100 p-5 flex gap-3">
          <SealMark className="h-5 w-5 shrink-0 text-escrow mt-0.5" />
          <p className="text-sm text-slate">
            If an account exists for <strong>{email}</strong>, we've sent a link to reset the password. It expires
            in 1 hour.
          </p>
        </div>
        <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-brass hover:underline">
          Back to login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Password reset"
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={
        <Link to="/login" className="font-semibold text-brass hover:underline">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          autoComplete="email"
        />
        <Button type="submit" loading={submitting} className="w-full" size="lg">
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}