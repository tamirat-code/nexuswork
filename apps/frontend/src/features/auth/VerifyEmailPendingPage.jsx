import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MailCheck, RefreshCw, LogOut, ArrowRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../components/notifications/ToastProvider.jsx";
import { resendVerification } from "../../services/api/auth.api.js";
import AuthShell from "./components/AuthShell.jsx";
import Button from "../../components/ui/Button.jsx";
import { useTranslation } from "react-i18next";

export default function VerifyEmailPendingPage() {
  const { user, token, logout, refreshMe } = useAuth();
  const { show } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // If user is verified, or is university_staff / admin (who skip email verification), redirect to dashboard
  useEffect(() => {
    if (!user) return;
    if (user.email_verified || user.role === "university_staff" || user.role === "admin") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleResend() {
    if (sending || cooldown > 0) return;
    setSending(true);
    try {
      await resendVerification(token);
      show(t("emailVerification.sent", { defaultValue: "Verification email sent. Check your inbox." }));
      setCooldown(60);
    } catch (err) {
      show(err.message || t("common.error", { defaultValue: "Failed to send email" }), { variant: "error" });
    } finally {
      setSending(false);
    }
  }

  async function handleCheckStatus() {
    try {
      await refreshMe();
    } catch (err) {
      // Best-effort refresh
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <AuthShell
      eyebrow={t("auth.oneMoreThing", { defaultValue: "One more thing" })}
      title={t("emailVerification.pendingTitle", { defaultValue: "Verify your email address" })}
      subtitle={t("emailVerification.pendingSubtitle", {
        defaultValue: "We sent a verification link to your email. Click the link in the email to activate your account and access the workspace.",
      })}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-brass/30 bg-brass/10 p-5 text-center sm:p-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brass/20 text-brass">
            <MailCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-4 font-display text-lg font-bold text-slate">
            {user?.email || t("emailVerification.yourEmail", { defaultValue: "your email address" })}
          </p>
          <p className="mt-1 text-xs text-slate-300">
            {t("emailVerification.pendingNote", { defaultValue: "Check your spam or junk folder if you don't see it in your inbox." })}
          </p>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={handleCheckStatus}
          >
            <ArrowRight className="h-4 w-4 mr-2" aria-hidden="true" />
            {t("emailVerification.alreadyVerified", { defaultValue: "I've verified my email" })}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            loading={sending}
            disabled={cooldown > 0}
            onClick={handleResend}
          >
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            {cooldown > 0
              ? t("emailVerification.resendIn", { count: cooldown, defaultValue: `Resend email in ${cooldown}s` })
              : t("emailVerification.resend", { defaultValue: "Resend email" })}
          </Button>
        </div>

        <div className="border-t border-ink-300 pt-4 text-center">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("auth.logOut", { defaultValue: "Log out or use a different account" })}
          </button>
        </div>
      </div>
    </AuthShell>
  );
}
