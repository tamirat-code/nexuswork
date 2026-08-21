import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../components/notifications/ToastProvider.jsx";
import AuthShell from "./components/AuthShell.jsx";
import GoogleAuthButton from "./components/GoogleAuthButton.jsx";
import RolePicker from "./components/RolePicker.jsx";
import TermsCheckbox from "./components/TermsCheckbox.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Select from "../../components/ui/Select.jsx";
import { listUniversities } from "../../services/api/universities.api.js";

function passwordIssue(password) {
  if (password.length < 8) return "At least 8 characters";
  if (!/[a-z]/.test(password)) return "Include at least one lowercase letter";
  if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter";
  if (!/[0-9]/.test(password)) return "Include at least one number";
  return null;
}

const CLIENT_ORGANIZATION_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "company", label: "Company" },
  { value: "university_department", label: "University department" },
  { value: "ngo", label: "NGO" },
  { value: "government", label: "Government organization" },
];

const ENROLLMENT_STATUSES = [
  { value: "enrolled", label: "Currently enrolled" },
  { value: "on_leave", label: "Currently on leave" },
  { value: "graduated", label: "Graduated" },
];

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
    organizationType: "individual",
    universityId: "",
    studentIdNumber: "",
    program: "",
    enrollmentStatus: "enrolled",
    phone: "",
  });

  const [step, setStep] = useState(1);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { data: universitiesRes, isLoading: universitiesLoading } = useQuery({
    queryKey: ["universities-all"],
    queryFn: () => listUniversities(),
  });
  const universities = universitiesRes?.data ?? [];

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  function validateRoleFields(next = {}) {
    if (role === "student") {
      if (!form.universityId) next.universityId = "Please select your university";
      if (!form.studentIdNumber.trim()) next.studentIdNumber = "Enter your student ID number";
      if (!form.program.trim()) next.program = "Enter your program or field of study";
      if (!form.enrollmentStatus) next.enrollmentStatus = "Select your enrollment status";
    }

    if (role === "client" && form.organizationType !== "individual" && !form.organizationName.trim()) {
      next.organizationName = "Enter your organization name";
    }

    return next;
  }

  function validatePrimaryStep() {
    const next = {};

    if (!form.name.trim()) next.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email";

    const pwIssue = passwordIssue(form.password);
    if (pwIssue) next.password = pwIssue;
    if (form.confirmPassword !== form.password) next.confirmPassword = "Passwords don't match";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateProfileStep() {
    const next = {};
    validateRoleFields(next);
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validate() {
    const next = {};

    if (!form.name.trim()) next.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email";

    const pwIssue = passwordIssue(form.password);
    if (pwIssue) next.password = pwIssue;
    if (form.confirmPassword !== form.password) next.confirmPassword = "Passwords don't match";

    validateRoleFields(next);

    if (!form.phone.trim()) next.phone = "Enter your phone number";
    else if (!/^[+0-9()\-\s]{7,30}$/.test(form.phone.trim())) next.phone = "Enter a valid phone number";

    if (!termsAccepted) {
      next.terms = "You must accept the Terms of Service and Privacy Policy";
    }

    if (!recaptchaToken) next.recaptcha = "Please complete the reCAPTCHA challenge";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateGoogleRegistration() {
    const next = {};
    validateRoleFields(next);
    if (!form.phone.trim()) next.phone = "Enter your phone number";
    else if (!/^[+0-9()\-\s]{7,30}$/.test(form.phone.trim())) next.phone = "Enter a valid phone number";
    if (!termsAccepted) next.terms = "You must accept the Terms of Service and Privacy Policy";
    setErrors((prev) => ({ ...prev, ...next }));
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
        phone: form.phone.trim(),
        termsAccepted,
        recaptchaToken,
        ...(role === "student"
          ? {
              university_id: form.universityId,
              student_id_number: form.studentIdNumber.trim(),
              program: form.program.trim(),
              enrollment_status: form.enrollmentStatus,
            }
          : {}),
        ...(role === "client"
          ? {
              organizationName: form.organizationName.trim() || undefined,
              organizationType: form.organizationType,
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
    if (err) return show(err.message, { variant: "error" });
    if (!validateGoogleRegistration()) return;

    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle(credential, {
        role,
        phone: form.phone.trim(),
        termsAccepted,
        ...(role === "student"
          ? {
              university_id: form.universityId,
              student_id_number: form.studentIdNumber.trim(),
              program: form.program.trim(),
              enrollment_status: form.enrollmentStatus,
            }
          : {}),
        ...(role === "client"
          ? {
              organizationName: form.organizationName.trim() || undefined,
              organizationType: form.organizationType,
            }
          : {}),
      });

      show(result.isNewUser ? "Account created with Google." : "Welcome back.");
      navigate("/dashboard");
    } catch (err) {
      show(err.message, { variant: "error" });
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleRoleChange(nextRole) {
    setRole(nextRole);
    setErrors({});
    setStep(1);
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      subtitle="Join as a student looking for work, a client with work to post, or university staff."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-cyan-400 hover:text-cyan-300">
            Log in
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 text-xs text-slate-300">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`h-1.5 flex-1 rounded-full ${step >= item ? "bg-cyan-400" : "bg-ink-300"}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className={step === 1 ? "font-semibold text-white" : ""}>1. Primary</span>
          <span className={step === 2 ? "font-semibold text-white" : ""}>2. Profile</span>
          <span className={step === 3 ? "font-semibold text-white" : ""}>3. Finish</span>
        </div>

        <RolePicker value={role} onChange={handleRoleChange} />

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {step === 1 && (
            <>
              <Input
                label="Full name"
                required
                value={form.name}
                onChange={update("name")}
                error={errors.name}
                autoComplete="name"
              />

              <Input
                label="Email"
                required
                type="email"
                value={form.email}
                onChange={update("email")}
                error={errors.email}
                autoComplete="email"
              />

              <Input
                label="Password"
                required
                type="password"
                value={form.password}
                onChange={update("password")}
                error={errors.password}
                hint="At least 8 characters, with upper, lower, and a number"
                autoComplete="new-password"
              />

              <Input
                label="Confirm password"
                required
                type="password"
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />

              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={() => {
                  if (validatePrimaryStep()) setStep(2);
                }}
              >
                Next
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              {role === "student" && (
                <div className="space-y-4 rounded-card border border-ink-300 bg-ink-100/50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Student information</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">
                      These details create your student profile and are used later for university verification.
                    </p>
                  </div>

                  <Select
                    label="University"
                    required
                    placeholder={universitiesLoading ? "Loading universities..." : "Select your university"}
                    value={form.universityId}
                    onChange={update("universityId")}
                    options={universities.map((university) => ({
                      value: university._id,
                      label: university.name,
                    }))}
                    error={errors.universityId}
                    disabled={universitiesLoading || universities.length === 0}
                    hint={
                      universities.length === 0 && !universitiesLoading
                        ? "No university is registered on NexusWork yet. Ask an administrator to add yours."
                        : "Choose the university where you are enrolled."
                    }
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Student ID number"
                      required
                      value={form.studentIdNumber}
                      onChange={update("studentIdNumber")}
                      error={errors.studentIdNumber}
                      placeholder="e.g. UGR/1234/15"
                      autoComplete="off"
                      maxLength={50}
                    />
                    <Select
                      label="Enrollment status"
                      required
                      value={form.enrollmentStatus}
                      onChange={update("enrollmentStatus")}
                      options={ENROLLMENT_STATUSES}
                      error={errors.enrollmentStatus}
                    />
                  </div>

                  <Input
                    label="Program / field of study"
                    required
                    value={form.program}
                    onChange={update("program")}
                    error={errors.program}
                    placeholder="e.g. BSc Computer Science"
                    maxLength={150}
                  />
                </div>
              )}

              {role === "client" && (
                <div className="space-y-4 rounded-card border border-ink-300 bg-ink-100/50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Client information</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">
                      Tell students whether you are hiring personally or on behalf of an organization.
                    </p>
                  </div>

                  <Select
                    label="Client type"
                    required
                    value={form.organizationType}
                    onChange={update("organizationType")}
                    options={CLIENT_ORGANIZATION_TYPES}
                    error={errors.organizationType}
                  />

                  {form.organizationType !== "individual" && (
                    <Input
                      label="Organization name"
                      required
                      value={form.organizationName}
                      onChange={update("organizationName")}
                      error={errors.organizationName}
                      autoComplete="organization"
                      placeholder="Your company, NGO, department, or organization"
                      maxLength={200}
                    />
                  )}
                </div>
              )}

              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={() => {
                  if (validateProfileStep()) setStep(3);
                }}
              >
                Next
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <Input
                label="Phone number"
                required
                type="tel"
                value={form.phone}
                onChange={update("phone")}
                error={errors.phone}
                autoComplete="tel"
                placeholder="e.g. +251 9XX XXX XXX"
                maxLength={30}
              />

              <TermsCheckbox checked={termsAccepted} onChange={setTermsAccepted} error={errors.terms} />

              <div>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setRecaptchaToken(token)}
                  onExpired={() => setRecaptchaToken(null)}
                />
                {errors.recaptcha && (
                  <p className="mt-1.5 text-sm text-brick" role="alert">
                    {errors.recaptcha}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  size="lg"
                  onClick={() => {
                    setErrors({});
                    setStep(2);
                  }}
                >
                  Back
                </Button>
                <Button type="submit" loading={submitting} className="flex-1" size="lg">
                  Finish registration
                </Button>
              </div>
            </>
          )}
        </form>

        <GoogleAuthButton onCredential={handleGoogleCredential} disabled={googleLoading || step !== 3} />

        <div className="flex items-center gap-3 text-xs text-slate-300">
          <div className="h-px flex-1 bg-ink-300" />
          or with email
          <div className="h-px flex-1 bg-ink-300" />
        </div>
      </div>
    </AuthShell>
  );
}