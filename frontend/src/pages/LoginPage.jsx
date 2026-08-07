/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, Fingerprint, QrCode,
  KeyRound, WifiOff, ArrowLeft, Sparkles, RefreshCw, Clock, MonitorSmartphone,
} from "lucide-react";

import AuthLayout from "../components/auth/AuthLayout";
import FloatingInput from "../components/auth/ui/FloatingInput";
import OtpInput from "../components/auth/ui/OtpInput";
import SocialAuthGrid from "../components/auth/ui/SocialAuthGrid";
import useOnlineStatus from "../hooks/useOnlineStatus";
import { useAuth } from "../context/AuthContext";

const DEMO_CODE = "246810";
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

const METHODS = [
  { id: "password", label: "Password", icon: KeyRound },
  { id: "otp", label: "Email Code", icon: Mail },
  { id: "passkey", label: "Passkey", icon: Fingerprint },
  { id: "qr", label: "QR", icon: QrCode },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const online = useOnlineStatus();
  const shakeControls = useAnimation();

  // Form state
  const [method, setMethod] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Flow state
  const [status, setStatus] = useState("idle"); // idle | submitting | 2fa | success
  const [twoFaCode, setTwoFaCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Security state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockSeconds, setLockSeconds] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);

  // UX state
  const [toast, setToast] = useState(null);
  const [recent, setRecent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nexus_recent_accounts")) || [];
    } catch {
      return [];
    }
  });

  const emailRef = useRef(null);

  /* ---------- Countdown timers ---------- */
  useEffect(() => {
    if (lockSeconds <= 0) return;
    const t = setInterval(() => setLockSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [lockSeconds > 0]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSeconds > 0]);

  /* ---------- Toast auto-dismiss ---------- */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = (type, message) => setToast({ type, message, id: Date.now() });

  const shake = () =>
    shakeControls.start({
      x: [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.5 },
    });

  /* ---------- Real-time validation ---------- */
  const validateEmail = (value) => {
    if (!value) return "Email is required";
    if (!EMAIL_REGEX.test(value)) return "Enter a valid email address";
    return undefined;
  };
  const validatePassword = (value) => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    return undefined;
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (touched.email) setErrors((p) => ({ ...p, email: validateEmail(email) }));
  }, [email, touched.email]);

  useEffect(() => {
    if (touched.password)
      setErrors((p) => ({ ...p, password: validatePassword(password) }));
  }, [password, touched.password]);

  /* ---------- Recently used accounts ---------- */
  const saveRecent = (user) => {
    const entry = { email: user.email, name: user.name, role: user.role };
    const next = [entry, ...recent.filter((r) => r.email !== user.email)].slice(0, 3);
    setRecent(next);
    localStorage.setItem("nexus_recent_accounts", JSON.stringify(next));
  };

  const finishLogin = (user) => {
    saveRecent(user);
    setStatus("success");
    setTimeout(() => navigate("/dashboard"), 1200);
  };

  const failLogin = (message) => {
    const attempts = failedAttempts + 1;
    setFailedAttempts(attempts);
    shake();
    if (attempts >= MAX_ATTEMPTS) {
      setLockSeconds(LOCK_SECONDS);
      notify("error", `Too many attempts. Locked for ${LOCK_SECONDS}s.`);
    } else {
      notify("error", message);
    }
  };

  /* ---------- Password login ---------- */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });
    if (emailError || passwordError) return;

    if (!online) return notify("error", "You're offline. Check your connection.");
    if (lockSeconds > 0) return notify("error", `Try again in ${lockSeconds}s.`);

    setStatus("submitting");
    try {
      const user = await login({ email, password });
      // Mock: every account has 2FA enabled
      setStatus("2fa");
      setTwoFaCode("");
      notify("info", "Verification code sent (demo: 246810)");
    } catch (err) {
      setStatus("idle");
      failLogin(err.message || "Invalid credentials.");
    }
  };

  const handleTwoFaVerify = async () => {
    if (twoFaCode !== DEMO_CODE) {
      shake();
      return notify("error", "Incorrect verification code.");
    }
    const user = JSON.parse(localStorage.getItem("nexus_user"));
    finishLogin(user);
  };

  const cancelTwoFa = () => {
    logout();
    setStatus("idle");
    setTwoFaCode("");
  };

  /* ---------- Email OTP login ---------- */
  const sendOtp = () => {
    const emailError = validateEmail(email);
    setTouched((p) => ({ ...p, email: true }));
    setErrors((p) => ({ ...p, email: emailError }));
    if (emailError) return;
    setOtpSent(true);
    setResendSeconds(30);
    notify("success", `Code sent to ${email} (demo: ${DEMO_CODE})`);
  };

  const verifyOtp = async () => {
    if (otpCode !== DEMO_CODE) {
      shake();
      return notify("error", "Incorrect code. Try again.");
    }
    try {
      const user = await login({ email, password: "123456" });
      finishLogin(user);
    } catch {
      notify("error", "No demo account for this email. Use the Password tab.");
    }
  };

  /* ---------- Passkey / QR (simulated WebAuthn) ---------- */
  const simulatePasskey = async () => {
    setStatus("submitting");
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const user = await login({ email: "student@test.com", password: "123456" });
      finishLogin(user);
    } catch {
      setStatus("idle");
      notify("error", "Passkey ceremony failed.");
    }
  };

  const handleSocial = (provider) =>
    notify("info", `${provider} sign-in activates after backend integration.`);

  const locked = lockSeconds > 0;
  const submitting = status === "submitting";

  /* ================= RENDER ================= */
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your NexusWork account">
      {/* Offline banner */}
      <AnimatePresence>
        {!online && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mb-5 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
          >
            <WifiOff className="h-4 w-4" /> You're offline — sign-in is disabled.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <div className="pointer-events-none fixed inset-x-0 top-5 z-[70] flex justify-center px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              role="status"
              className={`pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl backdrop-blur ${
                toast.type === "success"
                  ? "bg-emerald-600 text-white"
                  : toast.type === "error"
                  ? "bg-red-600 text-white"
                  : "bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900"
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-white/80 backdrop-blur dark:bg-slate-950/80"
          >
            <motion.svg viewBox="0 0 52 52" className="h-24 w-24">
              <motion.circle
                cx="26" cy="26" r="24" fill="none"
                stroke="#10b981" strokeWidth="3"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
              <motion.path
                d="M14 27l8 8 16-16" fill="none"
                stroke="#10b981" strokeWidth="4" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              />
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recently used accounts */}
      {recent.length > 0 && status === "idle" && (
        <div className="mb-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Recently used
          </p>
          <div className="flex flex-wrap gap-2">
            {recent.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setMethod("password");
                }}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-xs font-medium text-slate-700 transition-all hover:border-blue-400 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white">
                  {acc.name?.charAt(0) || "U"}
                </span>
                {acc.email}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Method switcher */}
      {status !== "2fa" && (
        <div
          role="tablist"
          aria-label="Sign-in methods"
          className="mb-6 grid grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-white/10 dark:bg-white/[0.03]"
        >
          {METHODS.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={method === m.id}
              onClick={() => setMethod(m.id)}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] font-semibold transition-colors sm:flex-row sm:text-xs ${
                method === m.id
                  ? "text-blue-600 dark:text-blue-300"
                  : "text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {method === m.id && (
                <motion.span
                  layoutId="method-pill"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <m.icon className="relative h-4 w-4" />
              <span className="relative">{m.label}</span>
            </button>
          ))}
        </div>
      )}

      <motion.div animate={shakeControls}>
        <AnimatePresence mode="wait">
          {/* ============ PASSWORD STEP ============ */}
          {status !== "2fa" && method === "password" && (
            <motion.form
              key="password"
              onSubmit={handlePasswordSubmit}
              noValidate
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <FloatingInput
                id="email"
                label="Email address"
                type="email"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                error={touched.email ? errors.email : undefined}
                showSuccess={touched.email && !errors.email && email}
                autoComplete="email"
                autoFocus
                disabled={submitting || locked}
              />

              <FloatingInput
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                error={touched.password ? errors.password : undefined}
                autoComplete="current-password"
                disabled={submitting || locked}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/40 dark:border-white/20 dark:bg-white/5"
                  />
                  Keep me signed in
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Forgot password?
                </Link>
              </div>

              {locked && (
                <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <Clock className="h-3.5 w-3.5" />
                  Too many failed attempts. Try again in {lockSeconds}s.
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || locked || !online}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                  </>
                ) : (
                  <>
                    Sign in securely
                    <ShieldCheck className="h-4 w-4 transition-transform group-hover:scale-110" />
                  </>
                )}
              </button>

              <SocialAuthGrid onSocial={handleSocial} />

              {/* Demo accounts */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/[0.02]">
                <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  <Sparkles className="h-3 w-3" /> Demo accounts
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Student", email: "student@test.com" },
                    { label: "Client", email: "client@test.com" },
                    { label: "University", email: "university@test.com" },
                    { label: "Admin", email: "admin@test.com" },
                  ].map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => {
                        setEmail(acc.email);
                        setPassword("123456");
                        setErrors({});
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:text-blue-300"
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.form>
          )}

          {/* ============ OTP STEP ============ */}
          {status !== "2fa" && method === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {!otpSent ? (
                <>
                  <FloatingInput
                    id="otp-email"
                    label="Email address"
                    type="email"
                    icon={Mail}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                    error={touched.email ? errors.email : undefined}
                    autoComplete="email"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={sendOtp}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl"
                  >
                    Send one-time code
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-sm text-slate-600 dark:text-zinc-400">
                      Enter the 6-digit code sent to
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{email}</p>
                  </div>
                  <OtpInput value={otpCode} onChange={setOtpCode} />
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={otpCode.length !== 6}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50"
                  >
                    Verify & sign in
                  </button>
                  <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-zinc-400">
                    <button type="button" onClick={() => { setOtpSent(false); setOtpCode(""); }} className="hover:underline">
                      Change email
                    </button>
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={resendSeconds > 0}
                      className="flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                      <RefreshCw className="h-3 w-3" />
                      {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend code"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ============ PASSKEY STEP ============ */}
          {status !== "2fa" && method === "passkey" && (
            <motion.div
              key="passkey"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-center"
            >
              <motion.div
                animate={submitting ? { scale: [1, 1.08, 1] } : {}}
                transition={{ repeat: submitting ? Infinity : 0, duration: 1 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-glow"
              >
                <Fingerprint className="h-10 w-10" />
              </motion.div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Sign in with Passkey
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                  Use your device's biometric sensor or security key. No password needed.
                </p>
              </div>
              <button
                type="button"
                onClick={simulatePasskey}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Waiting for device…
                  </>
                ) : (
                  <>
                    <MonitorSmartphone className="h-4 w-4" /> Use a passkey
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* ============ QR STEP ============ */}
          {status !== "2fa" && method === "qr" && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5 text-center"
            >
              <div className="mx-auto w-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-white/10">
                <QrPattern />
              </div>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Scan with the NexusWork mobile app to sign in instantly.
              </p>
              <button
                type="button"
                onClick={simulatePasskey}
                disabled={submitting}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-all hover:border-blue-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
              >
                {submitting ? "Waiting for scan…" : "Simulate scan (demo)"}
              </button>
            </motion.div>
          )}

          {/* ============ 2FA STEP ============ */}
          {status === "2fa" && (
            <motion.div
              key="2fa"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-500">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Two-factor authentication
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                  Enter the 6-digit code from your authenticator.
                </p>
              </div>

              <OtpInput value={twoFaCode} onChange={setTwoFaCode} />

              <p className="text-center text-xs text-slate-400 dark:text-zinc-500">
                Demo code: <span className="font-mono font-bold text-teal-500">{DEMO_CODE}</span>
              </p>

              <button
                type="button"
                onClick={handleTwoFaVerify}
                disabled={twoFaCode.length !== 6}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50"
              >
                Verify & continue
              </button>

              <button
                type="button"
                onClick={cancelTwoFa}
                className="mx-auto flex items-center gap-1 text-xs text-slate-500 hover:underline dark:text-zinc-400"
              >
                <ArrowLeft className="h-3 w-3" /> Cancel and sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {status !== "2fa" && (
        <p className="mt-8 text-center text-sm text-slate-500 dark:text-zinc-500">
          New to NexusWork?{" "}
          <Link to="/register" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
            Create an account
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}

/* Decorative demo QR pattern */
function QrPattern() {
  const cells = [];
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      const inFinder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      if (inFinder) continue;
      if ((x * 31 + y * 17 + ((x * y) % 7)) % 5 < 2) {
        cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
      }
    }
  }
  return (
    <svg viewBox="0 0 21 21" className="h-44 w-44 text-slate-900 dark:text-white" fill="currentColor" aria-label="Demo sign-in QR code">
      {cells}
      {[[0, 0], [14, 0], [0, 14]].map(([fx, fy], i) => (
        <g key={i}>
          <rect x={fx} y={fy} width={7} height={7} fill="none" stroke="currentColor" strokeWidth={1} />
          <rect x={fx + 2} y={fy + 2} width={3} height={3} />
        </g>
      ))}
    </svg>
  );
}