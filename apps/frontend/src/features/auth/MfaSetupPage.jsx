import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, CheckCircle2, Clipboard, Copy, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import AuthShell from "./components/AuthShell.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { useToast } from "../../components/notifications/ToastProvider.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import * as authApi from "../../services/api/auth.api.js";

const STORAGE_KEY = "nw_mfa_setup";

export default function MfaSetupPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, completeMfaLogin } = useAuth();
  const { show } = useToast();
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

  async function copyText(value, successMessage = "Copied to clipboard.") {
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(true);
      show(successMessage);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy automatically. Please select and copy the value manually.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Enter the 6-digit code shown in your authenticator app.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.setupMfa(setup.setupToken, code);
      sessionStorage.removeItem(STORAGE_KEY);
      completeMfaLogin(data.token, data.user);
      setRecoveryCodes(data.recoveryCodes || []);
      show("MFA is now enabled on your account.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!setup?.setupToken) {
    return (
      <AuthShell
        eyebrow="Security"
        title="MFA setup expired"
        subtitle={
          isProactive
            ? "For your security, this setup session is no longer valid. Head back to Settings and start again."
            : "For your security, this setup session is no longer valid. Return to login and start again."
        }
      >
        <div className="rounded-2xl border border-ink-300 bg-ink-500/30 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-brass/30 bg-brass/10 text-brass">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Your authenticator setup was not completed. No changes were made to your account.
          </p>
          <Button className="mt-5 w-full" size="lg" onClick={() => navigate(isProactive ? "/settings" : "/login")}>
            {isProactive ? "Return to settings" : "Return to login"}
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (recoveryCodes.length) {
    return (
      <AuthShell
        eyebrow="MFA enabled"
        title="Your account is protected"
        subtitle="Save these recovery codes before continuing. Each code works once if you lose access to your authenticator."
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-brass/20 bg-brass/5 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass/10 text-brass">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate">Keep these codes private</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                NexusWork will not show them again after you leave this page.
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
            <Button type="button" variant="secondary" onClick={() => copyText(recoveryText, "Recovery codes copied.")}>
              {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copied ? "Copied" : "Copy codes"}
            </Button>
            <Button className="w-full" size="lg" onClick={() => navigate(returnTo)}>
              {isProactive ? "Back to settings" : "Continue to NexusWork"}
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Protect your account"
      title="Set up two-factor authentication"
      subtitle="Use an authenticator app to add an extra layer of protection to your NexusWork account."
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2.5 rounded-xl border border-brass/20 bg-brass/5 px-4 py-3 text-xs leading-relaxed text-slate-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-brass" />
          <span>Your password alone will no longer be enough to sign in.</span>
        </div>

        <div className="grid gap-3">
          <SetupStep number="1" title="Open your authenticator app" description="Use Google Authenticator, Microsoft Authenticator, Authy, or another TOTP app." />

          <div className="rounded-2xl border border-ink-300 bg-ink-500/30 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass/10 text-xs font-semibold text-brass">
                2
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate">Add NexusWork</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  If your app supports an OTP URI, use the value below. Otherwise, enter the manual setup key.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-ink-300 bg-ink/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Manual setup key</p>
                <button
                  type="button"
                  onClick={() => copyText(setup.secret, "Setup key copied.")}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-brass transition hover:bg-brass/10"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-2 break-all font-mono text-sm leading-relaxed tracking-wide text-slate">{setup.secret}</p>
            </div>

            <details className="mt-3 rounded-xl border border-ink-300 bg-ink/20">
              <summary className="cursor-pointer px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-brass">
                Advanced: show OTP URI
              </summary>
              <div className="border-t border-ink-300 px-3 py-3">
                <p className="break-all font-mono text-[11px] leading-relaxed text-slate-400">{setup.otpauthUri}</p>
                <button
                  type="button"
                  onClick={() => copyText(setup.otpauthUri, "OTP URI copied.")}
                  className="mt-2 text-xs font-medium text-brass hover:underline"
                >
                  Copy OTP URI
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
                <p className="text-sm font-semibold text-slate">Verify your authenticator</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  Enter the current 6-digit code from your app. The code refreshes automatically every few seconds.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <Input
                label="6-digit authenticator code"
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
                Enable MFA
              </Button>
            </form>
          </div>

          <div className="flex gap-2.5 rounded-xl border border-ink-300/70 bg-ink-500/20 px-3.5 py-3 text-[11px] leading-relaxed text-slate-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
            <p>After activation, NexusWork will ask for an authenticator code whenever you sign in.</p>
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