import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthShell from "./components/AuthShell.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { useToast } from "../../components/notifications/ToastProvider.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import * as authApi from "../../services/api/auth.api.js";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "nw_mfa_challenge";

export default function MfaVerifyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { completeMfaLogin } = useAuth();
  const { show } = useToast();
  const { t } = useTranslation();
  const [challengeToken] = useState(() => location.state?.challengeToken || sessionStorage.getItem(STORAGE_KEY));
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (challengeToken) sessionStorage.setItem(STORAGE_KEY, challengeToken);
  }, [challengeToken]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.verifyMfa(challengeToken, code.trim());
      sessionStorage.removeItem(STORAGE_KEY);
      completeMfaLogin(data.token, data.user);
      show(t("auth.welcomeBack"));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!challengeToken) {
    return (
      <AuthShell eyebrow={t("mfa.security")} title={t("mfa.sessionExpired")} subtitle={t("mfa.signInAgain")}>
        <Button className="w-full" size="lg" onClick={() => navigate("/login")}>{t("mfa.returnToLogin")}</Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow={t("mfa.twoFactor")} title={t("mfa.enterCode")} subtitle={t("mfa.openAuthenticator")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t("mfa.codeLabel")} value={code} onChange={(e) => setCode(e.target.value.slice(0, 11))} inputMode="numeric" autoComplete="one-time-code" error={error} />
        <p className="text-xs text-slate-300">{t("mfa.recoveryHint")}</p>
        <Button type="submit" loading={loading} className="w-full" size="lg">{t("mfa.verifySignIn")}</Button>
      </form>
    </AuthShell>
  );
}
