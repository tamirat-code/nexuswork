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
  if (!/[a-z]/.test(password))
    return "Include at least one lowercase letter";
  if (!/[A-Z]/.test(password))
    return "Include at least one uppercase letter";
  if (!/[0-9]/.test(password))
    return "Include at least one number";

  return null;
}

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const [role, setRole] = useState("student");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
  });

  // Student information
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const update = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  function validate() {
    const next = {};

    if (!form.name.trim()) {
      next.name = "Enter your name";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email";
    }

    const pwIssue = passwordIssue(form.password);

    if (pwIssue) {
      next.password = pwIssue;
    }

    if (form.confirmPassword !== form.password) {
      next.confirmPassword = "Passwords don't match";
    }

    // Student validation
    if (role === "student") {
      if (!university) {
        next.university = "Please select your university";
      }

      if (!department) {
        next.department = "Please select your department";
      }
    }

    if (!termsAccepted) {
      next.terms =
        "You must accept the Terms of Service and Privacy Policy";
    }

    if (!recaptchaToken) {
      next.recaptcha = "Please complete the reCAPTCHA challenge";
    }

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

        ...(role === "student"
          ? {
              university,
              department,
            }
          : {}),

        ...(role === "client" && form.organizationName
          ? {
              organizationName: form.organizationName,
            }
          : {}),
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
    if (err) {
      return show(err.message, { variant: "error" });
    }

    if (!termsAccepted) {
      setErrors((prev) => ({
        ...prev,
        terms:
          "You must accept the Terms of Service and Privacy Policy",
      }));

      show(
        "You must accept the Terms of Service and Privacy Policy",
        { variant: "error" }
      );

      return;
    }

    // University/department are collected into the student profile
    // *after* the account is created — never block the Google popup
    // on them or the button appears dead.
    setGoogleLoading(true);

    try {
      const result = await loginWithGoogle(credential, {
        role,
        termsAccepted,

        ...(role === "student"
          ? {
              university,
              department,
            }
          : {}),

        ...(role === "client" && form.organizationName
          ? {
              organizationName: form.organizationName,
            }
          : {}),
      });

      show(
        result.isNewUser
          ? "Account created with Google."
          : "Welcome back."
      );

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
          <Link
            to="/login"
            className="font-medium text-cyan-400 hover:text-cyan-300"
          >
            Log in
          </Link>
        </>
      }
    >
      <div className="space-y-5">

        {/* Role Picker */}
        <RolePicker
          value={role}
          onChange={setRole}
        />

        {/* Client Organization */}
        {role === "client" && (
          <Input
            label="Organization name (optional)"
            value={form.organizationName}
            onChange={update("organizationName")}
            hint="Leave blank if you're hiring as an individual"
            autoComplete="organization"
          />
        )}

        {/* Terms */}
        <TermsCheckbox
          checked={termsAccepted}
          onChange={setTermsAccepted}
          error={errors.terms}
        />

        {/* Google */}
        <GoogleAuthButton
          onCredential={handleGoogleCredential}
          disabled={googleLoading}
        />

        {/* Divider */}
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <div className="h-px flex-1 bg-ink-300" />
          or with email
          <div className="h-px flex-1 bg-ink-300" />
        </div>

        {/* Registration Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4"
        >
          {/* Full Name */}
          <Input
            label="Full name"
            value={form.name}
            onChange={update("name")}
            error={errors.name}
            autoComplete="name"
          />

          {/* University */}
          {role === "student" && (
            <div>
              <label
                htmlFor="university"
                className="mb-1.5 block text-sm font-medium text-cyan-400"
              >
                University
              </label>

              <select
                id="university"
                value={university}
                onChange={(e) => {
                  setUniversity(e.target.value);

                  if (errors.university) {
                    setErrors((prev) => ({
                      ...prev,
                      university: undefined,
                    }));
                  }
                }}
                className="w-full rounded-xl border border-ink-300 bg-ink-100 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                <option value="">
                  Select your university
                </option>

                <option value="University of Gondar">
                  University of Gondar
                </option>

                <option value="Addis Ababa University">
                  Addis Ababa University
                </option>

                <option value="Bahir Dar University">
                  Bahir Dar University
                </option>

                <option value="Hawassa University">
                  Hawassa University
                </option>

                <option value="Jimma University">
                  Jimma University
                </option>

                <option value="Mekelle University">
                  Mekelle University
                </option>

                <option value="Haramaya University">
                  Haramaya University
                </option>

                <option value="Other">
                  Other
                </option>
              </select>

              {errors.university && (
                <p
                  className="mt-1.5 text-sm text-brick"
                  role="alert"
                >
                  {errors.university}
                </p>
              )}
            </div>
          )}

          {/* Department */}
          {role === "student" && (
            <div>
              <label
                htmlFor="department"
                className="mb-1.5 block text-sm font-medium text-cyan-400"
              >
                Department
              </label>

              <select
                id="department"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);

                  if (errors.department) {
                    setErrors((prev) => ({
                      ...prev,
                      department: undefined,
                    }));
                  }
                }}
                className="w-full rounded-xl border border-ink-300 bg-ink-100 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                <option value="">
                  Select your department
                </option>

                <option value="Software Engineering">
                  Software Engineering
                </option>

                <option value="Computer Science">
                  Computer Science
                </option>

                <option value="Information Technology">
                  Information Technology
                </option>

                <option value="Information Systems">
                  Information Systems
                </option>

                <option value="Computer Engineering">
                  Computer Engineering
                </option>

                <option value="Electrical Engineering">
                  Electrical Engineering
                </option>

                <option value="Networking">
                  Networking
                </option>

                <option value="Database Systems">
                  Database Systems
                </option>

                <option value="Artificial Intelligence">
                  Artificial Intelligence
                </option>

                <option value="Other">
                  Other
                </option>
              </select>

              {errors.department && (
                <p
                  className="mt-1.5 text-sm text-brick"
                  role="alert"
                >
                  {errors.department}
                </p>
              )}
            </div>
          )}

          {/* Email */}
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={update("email")}
            error={errors.email}
            autoComplete="email"
          />

          {/* Password */}
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={update("password")}
            error={errors.password}
            hint="At least 8 characters, with upper, lower, and a number"
            autoComplete="new-password"
          />

          {/* Confirm Password */}
          <Input
            label="Confirm password"
            type="password"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          {/* reCAPTCHA */}
          <div>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(token) => setRecaptchaToken(token)}
              onExpired={() => setRecaptchaToken(null)}
            />

            {errors.recaptcha && (
              <p
                className="mt-1.5 text-sm text-brick"
                role="alert"
              >
                {errors.recaptcha}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            loading={submitting}
            className="w-full"
            size="lg"
          >
            Create account
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}