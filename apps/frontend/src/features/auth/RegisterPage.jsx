import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../components/notifications/ToastProvider.jsx";
import AuthShell from "./components/AuthShell.jsx";
import GoogleAuthButton from "./components/GoogleAuthButton.jsx";
import RolePicker from "./components/RolePicker.jsx";
import TermsCheckbox from "./components/TermsCheckbox.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";

function passwordIssue(password) {
  if (password.length < 8) return "At least 8 characters";
  if (!/[a-z]/.test(password)) return "Include at least one lowercase letter";
  if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter";
  if (!/[0-9]/.test(password)) return "Include at least one number";
  return null;
}

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", organizationName: "" });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email";

    const pwIssue = passwordIssue(form.password);
    if (pwIssue) next.password = pwIssue;
    if (form.confirmPassword !== form.password) next.confirmPassword = "Passwords don't match";

    if (!termsAccepted) next.terms = "You must accept the Terms of Service and Privacy Policy";
    if (!recaptchaToken) next.recaptcha = "Please complete the reCAPTCHA challenge";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        termsAccepted,
        recaptchaToken,
        ...(role === "client" && form.organizationName ? { organizationName: form.organizationName } : {}),
      });
      show("Account created. Check your email to verify it.");
      navigate("/dashboard");
    } catch (err) {
      show(err.message, { variant: "error" });
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleCredential(credential, err) {
    if (err) return show(err.message, { variant: "error" });
    if (!termsAccepted) {
      setErrors((prev) => ({ ...prev, terms: "You must accept the Terms of Service and Privacy Policy" }));
      return;
    }
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle(credential, {
        role,
        termsAccepted,
        ...(role === "client" && form.organizationName ? { organizationName: form.organizationName } : {}),
      });
      show(result.isNewUser ? "Account created with Google." : "Welcome back.");
      navigate("/dashboard");
    } catch (err) {
      show(err.message, { variant: "error" });
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      subtitle="Join as a student looking for work, a client with work to post, or university staff."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brass hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <RolePicker value={role} onChange={setRole} />

        {role === "client" && (
          <Input
            label="Organization name (optional)"
            value={form.organizationName}
            onChange={update("organizationName")}
            hint="Leave blank if you're hiring as an individual"
            autoComplete="organization"
          />
        )}

        <TermsCheckbox checked={termsAccepted} onChange={setTermsAccepted} error={errors.terms} />

        <GoogleAuthButton onCredential={handleGoogleCredential} disabled={googleLoading} />

        <div className="flex items-center gap-3 text-xs text-slate-300">
          <div className="h-px flex-1 bg-ink-300" />
          or with email
          <div className="h-px flex-1 bg-ink-300" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input label="Full name" value={form.name} onChange={update("name")} error={errors.name} autoComplete="name" />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={update("email")}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={update("password")}
            error={errors.password}
            hint="At least 8 characters, with upper, lower, and a number"
            autoComplete="new-password"
          />
          <Input
            label="Confirm password"
            type="password"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <div>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(token) => setRecaptchaToken(token)}
              onExpired={() => setRecaptchaToken(null)}
            />
            {errors.recaptcha && (
              <p className="text-sm text-brick mt-1.5" role="alert">
                {errors.recaptcha}
              </p>
            )}
          </div>

          <Button type="submit" loading={submitting} className="w-full" size="lg">
            Create account
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}