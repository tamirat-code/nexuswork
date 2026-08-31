import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/api/auth.api.js";
import AuthShell from "./components/AuthShell.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { SealMark } from "./components/AuthShell.jsx";
import { useTranslation } from "react-i18next";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

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
      <AuthShell eyebrow={t("auth.checkInbox")} title={t("auth.resetLinkSent")}>
        <div className="rounded-card border border-escrow bg-escrow-100 p-5 flex gap-3">
          <SealMark className="h-5 w-5 shrink-0 text-escrow mt-0.5" />
          <p className="text-sm text-slate">
            {t("auth.resetLinkDescription", { email })}
          </p>
        </div>
        <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-brass hover:underline">
          {t("auth.backToLogin")}
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={t("auth.passwordReset")}
      title={t("auth.forgotPassword")}
      subtitle={t("auth.resetDescription")}
      footer={
        <Link to="/login" className="font-semibold text-brass hover:underline">
          {t("auth.backToLogin")}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label={t("auth.email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          autoComplete="email"
        />
        <Button type="submit" loading={submitting} className="w-full" size="lg">
          {t("auth.sendResetLink")}
        </Button>
      </form>
    </AuthShell>
  );
}
