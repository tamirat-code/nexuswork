import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../components/notifications/ToastProvider.jsx";
import AuthShell from "./components/AuthShell.jsx";
import GoogleAuthButton from "./components/GoogleAuthButton.jsx";
import RolePicker from "./components/RolePicker.jsx";
import TermsCheckbox from "./components/TermsCheckbox.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import ReCAPTCHA from "react-google-recaptcha";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [pendingGoogleCredential, setPendingGoogleCredential] = useState(null);
  const [pendingRole, setPendingRole] = useState("student");
  const [pendingTerms, setPendingTerms] = useState(false);
  const [pendingTermsError, setPendingTermsError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleRecaptchaToken, setGoogleRecaptchaToken] = useState(null);
  const [googleCheckPassed, setGoogleCheckPassed] = useState(false);
  const googleRecaptchaRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.mfaRequired) {
        navigate("/mfa/verify", { state: { challengeToken: result.challengeToken } });
        return;
      }
      if (result.mfaSetupRequired) {
        navigate("/mfa/setup", {
          state: {
            setupToken: result.setupToken,
            secret: result.secret,
            otpauthUri: result.otpauthUri,
          },
        });
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleCredential(credential, err) {
    if (err) return show(err.message, { variant: "error" });
    setPendingGoogleCredential(credential);
    setGoogleRecaptchaToken(null);
    setGoogleCheckPassed(false);
  }

  async function continueGoogleLogin() {
    if (!googleRecaptchaToken) {
      show("Please complete the reCAPTCHA challenge.", { variant: "error" });
      return;
    }
    setGoogleLoading(true);
    setGoogleCheckPassed(true);
    try {
      const result = await loginWithGoogle(pendingGoogleCredential, { recaptchaToken: googleRecaptchaToken });
      if (result.needsRole) {
        // The verification token is single-use. The role-completion request
        // must receive a fresh challenge token.
        googleRecaptchaRef.current?.reset();
        setGoogleRecaptchaToken(null);
        return;
      }
      if (result.mfaRequired) {
        navigate("/mfa/verify", { state: { challengeToken: result.challengeToken } });
        return;
      }
      if (result.mfaSetupRequired) {
        navigate("/mfa/setup", {
          state: {
            setupToken: result.setupToken,
            secret: result.secret,
            otpauthUri: result.otpauthUri,
          },
        });
        return;
      }
      show(result.isNewUser ? "Account created with Google." : "Welcome back.");
      navigate("/dashboard");
    } catch (err) {
      show(err.message, { variant: "error" });
      googleRecaptchaRef.current?.reset();
      setGoogleRecaptchaToken(null);
      setGoogleCheckPassed(false);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function completeGoogleWithRole() {
    if (!pendingTerms) {
      setPendingTermsError("You must accept the Terms of Service and Privacy Policy");
      return;
    }
    if (!googleRecaptchaToken) {
      show("Please complete the reCAPTCHA challenge.", { variant: "error" });
      return;
    }
    setGoogleLoading(true);
try {
  const result = await loginWithGoogle(pendingGoogleCredential, { role: pendingRole, termsAccepted: pendingTerms, recaptchaToken: googleRecaptchaToken });
  if (result.needsRole) {
    
    show("Something went wrong creating your account. Please try again.", { variant: "error" });
    return;
  }
  if (result.mfaRequired) {
    navigate("/mfa/verify", { state: { challengeToken: result.challengeToken } });
    return;
  }
  if (result.mfaSetupRequired) {
    navigate("/mfa/setup", {
      state: {
        setupToken: result.setupToken,
        secret: result.secret,
        otpauthUri: result.otpauthUri,
      },
    });
    return;
  }
  show("Account created with Google.");
  navigate("/dashboard");
    } catch (err) {
      show(err.message, { variant: "error" });
    } finally {
      setGoogleLoading(false);
    }
  }

  if (pendingGoogleCredential && !googleCheckPassed) {
    return (
      <AuthShell
        eyebrow="One more thing"
        title="Verify your Google sign-in"
        subtitle="Complete the security check before continuing with Google."
      >
        <div className="space-y-5">
          <ReCAPTCHA ref={googleRecaptchaRef} sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} onChange={setGoogleRecaptchaToken} onExpired={() => setGoogleRecaptchaToken(null)} />
          <Button onClick={continueGoogleLogin} loading={googleLoading} className="w-full" size="lg">Continue with Google</Button>
          <button
            type="button"
            onClick={() => setPendingGoogleCredential(null)}
            className="text-sm text-slate-300 hover:underline"
          >
            Use a different sign-in method
          </button>
        </div>
      </AuthShell>
    );
  }

  if (pendingGoogleCredential && googleCheckPassed && !googleLoading) {
    return (
      <AuthShell eyebrow="One more thing" title="Which best describes you?" subtitle="Pick a role to finish creating your account.">
        <div className="space-y-5">
          <RolePicker value={pendingRole} onChange={setPendingRole} />
          <TermsCheckbox checked={pendingTerms} onChange={setPendingTerms} error={pendingTermsError} />
          <div className="flex justify-center">
            <ReCAPTCHA ref={googleRecaptchaRef} sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} onChange={setGoogleRecaptchaToken} onExpired={() => setGoogleRecaptchaToken(null)} />
          </div>
          <Button onClick={completeGoogleWithRole} loading={googleLoading} className="w-full" size="lg">Create account</Button>
          <button type="button" onClick={() => { setPendingGoogleCredential(null); setGoogleRecaptchaToken(null); }} className="text-sm text-slate-300 hover:underline">Use a different sign-in method</button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in"
      footer={
        <>
          No account?{" "}
          <Link to="/register" className="font-semibold text-brass hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <GoogleAuthButton onCredential={handleGoogleCredential} disabled={googleLoading} />

        <div className="flex items-center gap-3 text-xs text-slate-300">
          <div className="h-px flex-1 bg-ink-300" />
          or with email
          <div className="h-px flex-1 bg-ink-300" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <div>
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              autoComplete="current-password"
            />
            <Link to="/forgot-password" className="mt-1.5 inline-block text-xs text-slate-300 hover:underline">
              Forgot your password?
            </Link>
          </div>
          <Button type="submit" loading={submitting} className="w-full" size="lg">
            Log in
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
