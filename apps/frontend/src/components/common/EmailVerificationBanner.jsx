import { useState } from "react";
import { MailCheck, RefreshCw } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../notifications/ToastProvider.jsx";
import { resendVerification } from "../../services/api/auth.api.js";
import Button from "../ui/Button.jsx";
import { useTranslation } from "react-i18next";

export default function EmailVerificationBanner() {
  const { user, token } = useAuth();
  const { show } = useToast();
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);

  if (!user || user.email_verified || !token) return null;

  async function handleResend() {
    if (sending) return;
    setSending(true);
    try {
      await resendVerification(token);
      show(t("emailVerification.sent"));
    } catch (err) {
      show(err.message, { variant: "error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      role="status"
      className="mb-6 flex flex-col gap-4 rounded-2xl border border-brass/30 bg-brass/10 px-4 py-4 text-slate sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brass/15 text-brass">
          <MailCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold">{t("emailVerification.title")}</p>
          <p className="mt-0.5 text-sm text-slate-300">
            {t("emailVerification.description", { email: user.email })}
          </p>
        </div>
      </div>
      <Button type="button" size="sm" variant="outline" loading={sending} onClick={handleResend}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {t("emailVerification.resend")}
      </Button>
    </section>
  );
}
