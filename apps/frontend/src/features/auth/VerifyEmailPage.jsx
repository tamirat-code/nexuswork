import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../../services/api/auth.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import AuthShell from "./components/AuthShell.jsx";
import { SealMark } from "./components/AuthShell.jsx";
import Skeleton from "../../components/loaders/Skeleton.jsx";
import { useTranslation } from "react-i18next";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user, setLocalUser, refreshMe } = useAuth();
  const [status, setStatus] = useState("verifying");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError(t("auth.missingVerificationToken"));
      return;
    }
    verifyEmail(token)
      .then(async () => {
        if (user) {
          try {
            await refreshMe();
          } catch {
            setLocalUser({ ...user, email_verified: true });
          }
        }
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setError(err.message);
      });
  }, [token]);

  if (status === "verifying") {
    return (
      <AuthShell eyebrow={t("auth.oneMoment")} title={t("auth.verifyingEmail")}>
        <Skeleton className="h-11 w-full" />
      </AuthShell>
    );
  }

  if (status === "success") {
    return (
      <AuthShell eyebrow={t("auth.verified")} title={t("auth.emailConfirmed")}>
        <div className="rounded-card border border-escrow bg-escrow-100 p-5 flex gap-3">
          <SealMark className="h-5 w-5 shrink-0 text-escrow mt-0.5" />
          <p className="text-sm text-slate">{t("auth.emailVerifiedDescription")}</p>
        </div>
        <Link to={user ? "/dashboard" : "/login"} className="mt-6 inline-block text-sm font-semibold text-brass hover:underline">
          {user ? t("navigation.dashboard") : t("auth.logIn")}
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow={t("auth.verificationFailed")} title={t("auth.linkDidNotWork")}>
      <div className="rounded-card border border-brick bg-brick-100 p-5">
        <p className="text-sm text-slate">{error}</p>
      </div>
      <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-brass hover:underline">
        {t("auth.backToLogin")}
      </Link>
    </AuthShell>
  );
}
