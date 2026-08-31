import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, CheckCircle2, Clipboard, Copy, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import AuthShell from "./components/AuthShell.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { useToast } from "../../components/notifications/ToastProvider.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import * as authApi from "../../services/api/auth.api.js";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "nw_mfa_setup";

export default function MfaSetupPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, completeMfaLogin } = useAuth();
  const { show } = useToast();
  const { t } = useTranslation();
  const [setup, setSetup] = useState(() => {
    if (location.state?.setupToken) return location.state;
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  });
  // Reached from Settings (already-authenticated opt-in) vs. from the login flow.
  const returnTo = setup?.returnTo || "/dashboard";
  const isProactive = Boolean(user);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (setup?.setupToken) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(setup));
  }, [setup]);

  const recoveryText = useMemo(() => recoveryCodes.join("\n"), [recoveryCodes]);

  async function copyText(value, successMessage = t("mfa.copied")) {
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(true);
      show(successMessage);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(t("common.error"));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError(t("mfa.enterSixDigit"));
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.setupMfa(setup.setupToken, code);
      sessionStorage.removeItem(STORAGE_KEY);
      completeMfaLogin(data.token, data.user);
      setRecoveryCodes(data.recoveryCodes || []);
      show(t("mfa.enabled"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!setup?.setupToken) {
    return (
      <AuthShell
        eyebrow={t("mfa.security")}
        title={t("mfa.setupExpired")}
        subtitle={
          isProactive
            ? t("mfa.setupExpiredSettings")
            : t("mfa.setupExpiredLogin")
        }
      >
        <div className="rounded-2xl border border-ink-300 bg-ink-500/30 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-brass/30 bg-brass/10 text-brass">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            {t("mfa.setupIncomplete")}
          </p>
          <Button className="mt-5 w-full" size="lg" onClick={() => navigate(isProactive ? "/settings" : "/login")}>
            {isProactive ? t("mfa.returnSettings") : t("mfa.returnToLogin")}
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (recoveryCodes.length) {
    return (
      <AuthShell
        eyebrow={t("mfa.enabled")}
        title={t("mfa.protected")}
        subtitle={t("mfa.saveCodes")}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-brass/20 bg-brass/5 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass/10 text-brass">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate">{t("mfa.keepPrivate")}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                {t("mfa.codesShownOnce")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-ink-300 bg-ink-500/20 p-4 font-mono text-sm text-slate">
            {recoveryCodes.map((item) => (
              <div key={item} className="rounded-lg bg-ink-500/40 px-3 py-2 text-center tracking-wide">
                {item}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button type="button" variant="secondary" onClick={() => copyText(recoveryText, t("mfa.codesCopied"))}>
              {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copied ? t("mfa.copied") : t("mfa.copyCodes")}
            </Button>
            <Button className="w-full" size="lg" onClick={() => navigate(returnTo)}>
              {isProactive ? t("mfa.backSettings") : t("mfa.continue")}
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={t("mfa.protect")}
      title={t("mfa.setupTitle")}
      subtitle={t("mfa.setupSubtitle")}
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2.5 rounded-xl border border-brass/20 bg-brass/5 px-4 py-3 text-xs leading-relaxed text-slate-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-brass" />
          <span>{t("mfa.passwordNotEnough")}</span>
        </div>

        <div className="grid gap-3">
          <SetupStep number="1" title={t("mfa.openApp")} description={t("mfa.appDescription")} />

          <div className="rounded-2xl border border-ink-300 bg-ink-500/30 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass/10 text-xs font-semibold text-brass">
                2
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate">{t("mfa.addNexus")}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  {t("mfa.addDescription")}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-ink-300 bg-ink/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{t("mfa.manualKey")}</p>
                <button
                  type="button"
                  onClick={() => copyText(setup.secret, t("mfa.keyCopied"))}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-brass transition hover:bg-brass/10"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t("mfa.copied") : t("mfa.copy")}
                </button>
              </div>
              <p className="mt-2 break-all font-mono text-sm leading-relaxed tracking-wide text-slate">{setup.secret}</p>
            </div>

            <details className="mt-3 rounded-xl border border-ink-300 bg-ink/20">
              <summary className="cursor-pointer px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-brass">
                {t("mfa.advancedUri")}
              </summary>
              <div className="border-t border-ink-300 px-3 py-3">
                <p className="break-all font-mono text-[11px] leading-relaxed text-slate-400">{setup.otpauthUri}</p>
                <button
                  type="button"
                  onClick={() => copyText(setup.otpauthUri, t("mfa.uriCopied"))}
                  className="mt-2 text-xs font-medium text-brass hover:underline"
                >
                  {t("mfa.copyUri")}
                </button>
              </div>
            </details>
          </div>

          <div className="rounded-2xl border border-ink-300 bg-ink-500/30 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass/10 text-xs font-semibold text-brass">
                3
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate">{t("mfa.verifyAuthenticator")}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  {t("mfa.verifyDescription")}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <Input
                label={t("mfa.sixDigitCode")}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                className="text-center font-mono text-lg tracking-[0.45em]"
                error={error}
              />
              <Button type="submit" loading={loading} disabled={code.length !== 6} className="w-full" size="lg">
                <KeyRound className="h-4 w-4" />
                {t("mfa.enable")}
              </Button>
            </form>
          </div>

          <div className="flex gap-2.5 rounded-xl border border-ink-300/70 bg-ink-500/20 px-3.5 py-3 text-[11px] leading-relaxed text-slate-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
            <p>{t("mfa.afterActivation")}</p>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}

function SetupStep({ number, title, description }) {
  return (
    <div className="rounded-2xl border border-ink-300 bg-ink-500/30 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass/10 text-xs font-semibold text-brass">
          {number}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{description}</p>
        </div>
      </div>
    </div>
  );
}
