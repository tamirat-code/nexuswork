import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileJson, ShieldCheck } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardDivider,
  CardHeader,
  FileUpload,
  Input,
  PageHeader,
  ProgressBar,
  Select,
  Tabs,
  Textarea,
} from "../../components/ui/index.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../components/notifications/ToastProvider.jsx";
import { ROLE_LABELS } from "../../constants/roles.constants.js";
import { removeMyAvatar, updateMe, updateMyAvatar } from "../../services/api/users.api.js";
import { getMyStudentProfile, updateMyStudentProfile } from "../../services/api/students.api.js";
import { listUniversities } from "../../services/api/universities.api.js";
import {
  downloadCredentialCardPdf,
  exportMyCredential,
  getMyVerifications,
  requestVerification,
  getMySkillCertificationRequests,
  submitSkillCertificationRequest,
} from "../../services/api/verifications.api.js";
import { getMyStaffVerifications, requestStaffVerification } from "../../services/api/staff-verifications.api.js";
import { uploadFile, deleteFile } from "../../services/api/files.api.js";
import AvatarUploader from "./AvatarUploader.jsx";
import { PROFILE_LIMITS, profileCompleteness, validateProfile } from "./profile.utils.js";
import { useTranslation } from "react-i18next";

const EMPTY = {
  name: "",
  email: "",
  headline: "",
  bio: "",
  location: "",
  university: "",
  skills: "",
  website: "",
};

const ENROLLMENT_STATUSES = [
  { value: "enrolled", label: "Currently enrolled" },
  { value: "on_leave", label: "Currently on leave" },
  { value: "graduated", label: "Graduated" },
  { value: "unknown", label: "Prefer not to say" },
];

const fromUser = (user) => ({
  ...EMPTY,
  ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, user?.[k] ?? ""])),
});

export default function ProfilePage() {
  const { user, token, setLocalUser } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState("general");

  const initial = useMemo(() => fromUser(user), [user]);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [summary, setSummary] = useState("");

  const isStudent = user?.role === "student";

  // Enrollment status lives on the separate StudentProfile record (not the
  // User document), and isn't collected at signup anymore — so it's fetched
  // and saved independently here, the one place a student can set it.
  const studentProfileQuery = useQuery({
    queryKey: ["my-student-profile"],
    queryFn: () => getMyStudentProfile(token),
    enabled: isStudent && !!token,
  });
  const savedEnrollmentStatus = studentProfileQuery.data?.data?.enrollment_status || "unknown";
  const [enrollmentStatus, setEnrollmentStatus] = useState(savedEnrollmentStatus);

  useEffect(() => {
    setEnrollmentStatus(savedEnrollmentStatus);
  }, [savedEnrollmentStatus]);

  const dirty = useMemo(
    () =>
      Object.keys(EMPTY).some((k) => (form[k] ?? "") !== (initial[k] ?? "")) ||
      (isStudent && enrollmentStatus !== savedEnrollmentStatus),
    [form, initial, isStudent, enrollmentStatus, savedEnrollmentStatus]
  );
  const completeness = useMemo(() => profileCompleteness(form), [form]);

  const set = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (touched[key]) {
      setErrors(validateProfile({ ...form, [key]: value }));
    }
  };

  const blur = (key) => () => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors(validateProfile(form));
  };

  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
      );
      const result = await updateMe(payload, token);
      if (isStudent && enrollmentStatus !== savedEnrollmentStatus) {
        await updateMyStudentProfile({ enrollment_status: enrollmentStatus }, token);
      }
      return result;
    },
    onSuccess: (res) => {
      const next = res?.data ?? { ...user, ...form };
      setLocalUser?.(next);
      setForm(fromUser(next));
      setTouched({});
      setSummary("");
      if (isStudent) qc.invalidateQueries({ queryKey: ["my-student-profile"] });
      toast.show(t("profile.updated", { defaultValue: "Profile updated." }));
    },
    onError: (err) => {
      setSummary(err?.message || t("profile.saveError", { defaultValue: "We couldn't save your profile. Please try again." }));
    },
  });

  const [avatarError, setAvatarError] = useState("");

  const avatarUpload = useMutation({
    mutationFn: (dataUrl) => updateMyAvatar(dataUrl, token),
    onMutate: () => setAvatarError(""),
    onSuccess: (res, dataUrl) => {
      setLocalUser?.({ ...user, avatarUrl: res?.data?.avatarUrl ?? dataUrl });
      toast.show(t("profile.photoUpdated", { defaultValue: "Profile photo updated." }));
    },
    onError: (err) => {
      setAvatarError(err?.message || "We couldn't upload that photo. Please try again.");
      throw err;
    },
  });

  const avatarRemove = useMutation({
    mutationFn: () => removeMyAvatar(token),
    onMutate: () => setAvatarError(""),
    onSuccess: () => {
      setLocalUser?.({ ...user, avatarUrl: null });
      toast.show(t("profile.photoRemoved", { defaultValue: "Profile photo removed." }));
    },
    onError: (err) => setAvatarError(err?.message || "We couldn't remove that photo. Please try again."),
  });

  function handleSubmit(event) {
    event.preventDefault();
    const next = validateProfile(form);
    setErrors(next);
    setTouched(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, true])));

    const count = Object.keys(next).length;
    if (count > 0) {
      setSummary(`${count} field${count > 1 ? "s" : ""} need${count > 1 ? "" : "s"} attention before saving.`);
      const first = document.getElementById(`profile-${Object.keys(next)[0]}`);
      first?.focus();
      return;
    }
    setSummary("");
    save.mutate();
  }

  function reset() {
    setForm(initial);
    setEnrollmentStatus(savedEnrollmentStatus);
    setErrors({});
    setTouched({});
    setSummary("");
  }

  const tabItems = [
    { value: "general", label: t("profile.generalIdentity", { defaultValue: "General & Identity" }) },
    {
      value: "verification",
      label: user?.universityVerified || user?.staffVerified ? t("profile.verification", { defaultValue: "Verification ✓" }) : t("profile.verificationRequest", { defaultValue: "Verification Request" }),
    },
    { value: "strength", label: t("profile.strengthSecurity", { defaultValue: "Strength & Security" }) },
  ];

  return (
    <div className="w-full">
      <PageHeader
        eyebrow={t("common.account")}
        title={t("profile.title", { defaultValue: "Profile & settings" })}
        description={t("profile.description", { defaultValue: "Keep your profile up to date for client proposals and university verification." })}
        breadcrumbs={[{ label: "Workspace", to: "/dashboard" }, { label: "Profile" }]}
        actions={
          <>
            <Button variant="secondary" onClick={reset} disabled={!dirty || save.isPending}>
              {t("profile.discard", { defaultValue: "Discard changes" })}
            </Button>
            <Button type="submit" form="profile-form" loading={save.isPending} disabled={!dirty}>
              {t("common.save")}
            </Button>
          </>
        }
      />

      {/* ── Compact Tab Bar to eliminate vertical scrolling ── */}
      <div className="mb-6">
        <Tabs items={tabItems} value={activeTab} onChange={setActiveTab} ariaLabel={t("profile.sections", { defaultValue: "Profile sections" })} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form id="profile-form" noValidate onSubmit={handleSubmit} className="space-y-6">
          <div aria-live="polite">
            {summary && (
              <Alert live variant={save.isError ? "danger" : "warning"} title={t("profile.checkDetails", { defaultValue: "Check your details" })}>
                {summary}
              </Alert>
            )}
          </div>

          {/* TAB 1: General & Identity — Ultra-compact 2-column layout */}
          {activeTab === "general" && (
            <Card as="section" className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                <div>
                  <h2 className="font-display text-xl font-extrabold text-slate">{t("profile.generalProfile", { defaultValue: "General Profile" })}</h2>
                  <p className="text-xs text-slate-300">{t("profile.generalProfileDescription", { defaultValue: "Identity, bio, and portfolio details shown on your public profile." })}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="brand">{ROLE_LABELS[user?.role] || "Member"}</Badge>
                  {user?.universityVerified && <Badge tone="success">{t("students.verified")} ✓</Badge>}
                </div>
              </div>
              <CardDivider className="mb-5" />

              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column: Identity & Photo */}
                <div className="space-y-4">
                  <AvatarUploader
                    name={form.name || user?.name || ""}
                    src={user?.avatarUrl}
                    verified={Boolean(user?.universityVerified)}
                    uploading={avatarUpload.isPending}
                    removing={avatarRemove.isPending}
                    uploadError={avatarError}
                    onUpload={(dataUrl) => avatarUpload.mutateAsync(dataUrl)}
                    onRemove={() => avatarRemove.mutate()}
                  />

                  <Input
                    id="profile-name"
                    label={t("registration.fullName")}
                    required
                    value={form.name}
                    onChange={set("name")}
                    onBlur={blur("name")}
                    error={touched.name ? errors.name : undefined}
                    autoComplete="name"
                    maxLength={PROFILE_LIMITS.name}
                  />

                  <Input
                    id="profile-email"
                    label={t("profile.emailAddress", { defaultValue: "Email address" })}
                    type="email"
                    required
                    value={form.email}
                    onChange={set("email")}
                    onBlur={blur("email")}
                    error={touched.email ? errors.email : undefined}
                    autoComplete="email"
                  />

                  <Input
                    id="profile-headline"
                    label={t("profile.headline")}
                    optional
                    value={form.headline}
                    onChange={set("headline")}
                    onBlur={blur("headline")}
                    error={touched.headline ? errors.headline : undefined}
                    placeholder={t("profile.headlinePlaceholder")}
                    maxLength={PROFILE_LIMITS.headline}
                  />
                </div>

                {/* Right Column: Bio & Portfolio Links */}
                <div className="space-y-4">
                  <Textarea
                    id="profile-bio"
                    label={t("profile.shortBio", { defaultValue: "Short bio" })}
                    optional
                    rows={3}
                    value={form.bio}
                    onChange={set("bio")}
                    onBlur={blur("bio")}
                    error={touched.bio ? errors.bio : undefined}
                    maxLength={PROFILE_LIMITS.bio}
                    placeholder={t("profile.bioPlaceholder", { defaultValue: "A brief overview of your expertise and goals..." })}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      id="profile-location"
                      label={t("profile.location", { defaultValue: "Location" })}
                      optional
                      value={form.location}
                      onChange={set("location")}
                      onBlur={blur("location")}
                      error={touched.location ? errors.location : undefined}
                      placeholder={t("profile.locationPlaceholder", { defaultValue: "Addis Ababa" })}
                      maxLength={PROFILE_LIMITS.location}
                    />
                    <Input
                      id="profile-university"
                      label={t("registration.university")}
                      optional
                      value={form.university}
                      onChange={set("university")}
                      onBlur={blur("university")}
                      error={touched.university ? errors.university : undefined}
                      maxLength={PROFILE_LIMITS.university}
                    />
                  </div>

                  {isStudent && (
                    <Select
                      id="profile-enrollment-status"
                      label={t("registration.enrollmentStatus")}
                      optional
                      value={enrollmentStatus}
                      onChange={(e) => setEnrollmentStatus(e.target.value)}
                      options={ENROLLMENT_STATUSES.map((option) => ({ ...option, label: t(`registration.enrollment.${option.value}`) }))}
                      disabled={studentProfileQuery.isLoading}
                      hint={t("profile.enrollmentHint", { defaultValue: "Shown to clients and used by your university for verification." })}
                    />
                  )}

                  <Input
                    id="profile-skills"
                    label={t("profile.skills")}
                    optional
                    value={form.skills}
                    onChange={set("skills")}
                    onBlur={blur("skills")}
                    error={touched.skills ? errors.skills : undefined}
                    placeholder={t("profile.skillsExample", { defaultValue: "React, Python, Figma" })}
                    maxLength={PROFILE_LIMITS.skills}
                  />

                  <Input
                    id="profile-website"
                    label={t("profile.portfolioUrl", { defaultValue: "Portfolio URL" })}
                    optional
                    type="url"
                    inputMode="url"
                    value={form.website}
                    onChange={set("website")}
                    onBlur={blur("website")}
                    error={touched.website ? errors.website : undefined}
                    placeholder="https://portfolio.dev"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* TAB 2: Verification */}
          {activeTab === "verification" && (
            <>
              {user?.role === "student" && (
                <>
                  <UniversityVerificationCard user={user} token={token} />
                  <SkillCertificationCard
                    token={token}
                    user={user}
                    profile={studentProfileQuery.data?.data}
                    universityVerified={Boolean(user?.universityVerified || studentProfileQuery.data?.data?.verification_status === "verified")}
                  />
                </>
              )}
              {user?.role === "university_staff" && <StaffVerificationCard user={user} token={token} />}
              {user?.role !== "student" && user?.role !== "university_staff" && (
                <Card as="section">
                  <CardHeader title="Verification" description="Client profiles do not require university enrollment proof." />
                  <p className="mt-4 text-base text-slate-300">
                    Your account is registered as a Client. You can post projects and fund escrow directly.
                  </p>
                </Card>
              )}
            </>
          )}

          {/* TAB 3: Strength & Security */}
          {activeTab === "strength" && (
            <Card as="section">
              <CardHeader title="Account Security & Settings" description="Manage password, preferences, and notifications." />
              <CardDivider className="my-5" />
              <CardFooterLinks />
            </Card>
          )}

          {/* Mobile action bar */}
          <div className="flex flex-wrap gap-3 lg:hidden">
            <Button type="submit" loading={save.isPending} disabled={!dirty} fullWidth>
              Save changes
            </Button>
            <Button variant="secondary" onClick={reset} disabled={!dirty || save.isPending} fullWidth>
              Discard changes
            </Button>
          </div>
        </form>

        <aside className="space-y-6">
          <Card as="section">
            <CardHeader
              titleAs="h2"
              title={t("profile.strengthTitle", { defaultValue: "Profile strength" })}
              description={t("profile.strengthDescription", { defaultValue: "Complete profiles get more invitations." })}
            />
            <div className="mt-5">
              <ProgressBar
                value={completeness.percent}
                label={t("profile.sectionsComplete", { done: completeness.done, total: completeness.total, defaultValue: `${completeness.done} of ${completeness.total} sections complete` })}
                valueText={t("profile.percentComplete", { percent: completeness.percent, defaultValue: `${completeness.percent}% complete` })}
                showValue
                tone={completeness.percent >= 80 ? "success" : completeness.percent >= 50 ? "warning" : "danger"}
              />
            </div>

            {completeness.missing.length > 0 ? (
              <>
                <p className="mt-5 text-xs font-bold uppercase tracking-widest text-brass">{t("profile.stillToAdd", { defaultValue: "Still to add" })}</p>
                <ul className="mt-2 space-y-1.5 text-sm font-medium text-slate-300">
                  {completeness.missing.map((item) => (
                    <li key={item.key} className="flex items-start gap-2">
                      <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brass" />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 text-sm font-medium text-slate-300">
                {t("profile.everythingComplete", { defaultValue: "Everything is filled in — nice work. Review it each term so it stays current." })}
              </p>
            )}
          </Card>

          <Card as="section">
            <CardHeader titleAs="h2" title="Quick Links" description="Security and preferences." />
            <CardFooterLinks />
          </Card>
        </aside>
      </div>
    </div>
  );
}

const VERIFICATION_DOC_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const VERIFICATION_DOC_MAX_MB = 10;

function formatCredentialDate(value) {
  if (!value) return "Issued by NexusWork";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function CredentialCardPreview({ verification, user }) {
  const { t } = useTranslation();
  const university = verification?.university_id?.name || user?.university || "Verified university";
  const name = verification?.full_name || user?.name || "Verified student";
  const issued = formatCredentialDate(verification?.reviewed_at || verification?.updatedAt || verification?.createdAt);

  return (
    <div className="mt-5 overflow-hidden rounded-card border border-border-strong bg-surface-elevated shadow-elevated">
      <div className="grid md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative p-6 text-content-primary sm:p-7">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-brass/50 bg-brass/10 text-brass">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brass-300">NexusWork</p>
              <p className="text-sm font-semibold text-content-primary">{t("profile.credentialCard", { defaultValue: "Verified Credential Card" })}</p>
            </div>
          </div>
          <p className="mt-8 text-3xl font-black leading-tight tracking-normal sm:text-4xl">{name}</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-content-secondary">
            University enrollment verified for {verification?.program || "an approved academic program"}.
          </p>
        </div>
        <div className="bg-surface p-6 text-slate sm:p-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-success">
            <span className="h-2 w-2 rounded-full bg-success" />
            Signed VC / Open Badge
          </div>
          <dl className="mt-7 space-y-4">
            <div>
              <dt className="text-xs font-extrabold uppercase tracking-widest text-slate-300">{t("profile.institution", { defaultValue: "Institution" })}</dt>
              <dd className="mt-1 text-base font-bold text-slate">{university}</dd>
            </div>
            <div>
              <dt className="text-xs font-extrabold uppercase tracking-widest text-slate-300">{t("profile.issued", { defaultValue: "Issued" })}</dt>
              <dd className="mt-1 text-base font-bold text-slate">{issued}</dd>
            </div>
            <div>
              <dt className="text-xs font-extrabold uppercase tracking-widest text-slate-300">{t("profile.proof", { defaultValue: "Proof" })}</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-300">{t("profile.cryptographicProof", { defaultValue: "Cryptographic signature included in download" })}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function SkillCertificationCard({ token, user, profile, universityVerified }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();
  const [skillName, setSkillName] = useState("");
  const [method, setMethod] = useState("practical_assessment");
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseCompletedAt, setCourseCompletedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [evidence, setEvidence] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["my-skill-certification-requests"],
    queryFn: () => getMySkillCertificationRequests(token),
    enabled: !!token,
  });
  const requests = data?.data || [];
  const profileSkills = profile?.skills || [];
  const userSkillNames = (user?.skills || "").split(",").map((s) => s.trim()).filter(Boolean);
  const existingNames = new Set(profileSkills.map((s) => String(s.name).toLowerCase()));
  const mergedSkills = [
    ...profileSkills,
    ...userSkillNames
      .filter((name) => !existingNames.has(name.toLowerCase()))
      .map((name) => ({ name, verification_method: "self_declared" })),
  ];
  const skills = mergedSkills.filter((skill) => skill.verification_method !== "university_certified");

  const submit = useMutation({
    mutationFn: () => submitSkillCertificationRequest({
      skill_name: skillName,
      assessment_method: method,
      ...(method === "coursework_linkage" ? { course_name: courseName.trim(), course_code: courseCode.trim(), course_completed_at: courseCompletedAt || undefined } : {}),
      student_notes: notes.trim(),
      evidence_file_id: evidence._id,
    }, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-skill-certification-requests"] });
      setSkillName(""); setNotes(""); setEvidence(null); setMethod("practical_assessment"); setCourseName(""); setCourseCode(""); setCourseCompletedAt("");
      toast.show("Skill certification request submitted to your university.");
    },
    onError: (error) => toast.show(error?.message || "Could not submit skill certification request.", { variant: "error" }),
  });

  async function uploadEvidence(file) {
    if (!file) return;
    setUploading(true);
    try {
      const response = await uploadFile(file, { relatedType: "skill_certification_evidence", token });
      setEvidence(response.data);
      toast.show("Evidence uploaded. Submit the request to send it for review.");
    } catch (error) {
      toast.show(error?.message || "Could not upload evidence.", { variant: "error" });
    } finally { setUploading(false); }
  }

  return (
    <Card as="section">
      <CardHeader title={t("profile.skillCertification", { defaultValue: "Skill certification" })} description={t("profile.skillCertificationDescription", { defaultValue: "Submit evidence for a university reviewer. A badge is issued only after a reviewer checks your work." })} />
      {!universityVerified ? (
        <Alert variant="warning" title={t("profile.verifyUniversityFirst", { defaultValue: "Verify your university first" })}>{t("profile.skillCertificationLocked", { defaultValue: "University skill certification is available after your enrollment verification is approved." })}</Alert>
      ) : (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Select label={t("profile.skillToCertify", { defaultValue: "Skill to certify" })} value={skillName} onChange={(event) => setSkillName(event.target.value)} options={[{ value: "", label: skills.length ? t("profile.selectProfileSkill", { defaultValue: "Select a profile skill" }) : t("profile.addSkillFirst", { defaultValue: "Add a skill in General Profile first" }) }, ...skills.map((skill) => ({ value: skill.name, label: skill.name }))]} disabled={!skills.length} />
            <Select label={t("profile.evidenceType", { defaultValue: "Evidence type" })} value={method} onChange={(event) => setMethod(event.target.value)} options={[{ value: "practical_assessment", label: t("profile.practicalAssessment", { defaultValue: "Practical assessment" }) }, { value: "portfolio_review", label: t("profile.portfolioReview", { defaultValue: "Portfolio review" }) }, { value: "coursework_linkage", label: t("profile.courseworkLinkage", { defaultValue: "Coursework linkage" }) }]} />
          </div>
          {method === "coursework_linkage" && <div className="mt-4 grid gap-4 md:grid-cols-3"><Input label="Course name" value={courseName} onChange={(event) => setCourseName(event.target.value)} maxLength={200} placeholder="Advanced Web Development" /><Input label="Course code (optional)" value={courseCode} onChange={(event) => setCourseCode(event.target.value)} maxLength={50} placeholder="CS-401" /><Input label="Completion date (optional)" type="date" value={courseCompletedAt} onChange={(event) => setCourseCompletedAt(event.target.value)} /></div>}
          <Textarea className="mt-4" label="What should the reviewer verify?" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={2000} placeholder="Describe the work, course, or assessment and what it demonstrates (at least 20 characters)." />
          <div className="mt-4">
            <label className="block text-sm font-semibold text-slate">Evidence file
              <input className="mt-2 block w-full text-sm text-slate-300" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.txt,application/pdf,image/*,application/zip,text/plain" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; uploadEvidence(file); }} />
            </label>
            {evidence && <p className="mt-1 text-xs text-escrow">Attached: {evidence.original_name}</p>}
          </div>
          <Button className="mt-4" loading={submit.isPending || uploading} disabled={!skillName || !evidence || notes.trim().length < 20 || (method === "coursework_linkage" && !courseName.trim())} onClick={() => submit.mutate()}>{t("profile.requestCertification", { defaultValue: "Request certification" })}</Button>
        </>
      )}
      <CardDivider className="my-5" />
      <h3 className="font-semibold text-slate">{t("profile.requestHistory", { defaultValue: "Request history" })}</h3>
      {isLoading ? <p className="mt-2 text-sm text-slate-300">Loading requests…</p> : requests.length === 0 ? <p className="mt-2 text-sm text-slate-300">No certification requests yet.</p> : (
        <div className="mt-3 space-y-2">{requests.map((request) => <div key={request._id} className="rounded-control border border-ink-300 p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-semibold text-slate">{request.skill_name}</span><Badge tone={request.status === "approved" ? "success" : request.status === "rejected" ? "danger" : "warning"}>{request.status}</Badge></div>{request.review_notes && <p className="mt-1 text-slate-300">{request.review_notes}</p>}</div>)}</div>
      )}
    </Card>
  );
}

function UniversityVerificationCard({ user, token }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();
  const { refreshMe } = useAuth();
  const [universityId, setUniversityId] = useState("");
  const [fullName, setFullName] = useState(user?.name || "");
  const [studentIdNumber, setStudentIdNumber] = useState("");
  const [program, setProgram] = useState("");
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const { data: universitiesRes, isLoading: universitiesLoading } = useQuery({
    queryKey: ["universities-all"],
    queryFn: () => listUniversities("?limit=200"),
  });
  const { data: verificationsRes, isLoading: verificationsLoading } = useQuery({
    queryKey: ["my-verifications"],
    queryFn: () => getMyVerifications(token),
    enabled: !!token,
  });

  const universities = universitiesRes?.data ?? [];
  const verifications = verificationsRes?.data ?? [];
  const latest = verifications[0];

  const isApproved = latest?.status === "approved" || Boolean(user?.universityVerified);

  const exportCredential = useMutation({
    mutationFn: async (format) => {
      if (format === "card") {
        await downloadCredentialCardPdf(latest?._id, token);
        return { format };
      }
      const res = await exportMyCredential(latest?._id, token);
      return { res, format };
    },
    onSuccess: ({ res, format }) => {
      if (format === "card") {
        toast.show("Credential card PDF downloaded.");
        return;
      }
      const credential = res?.data ?? res;
      const blob = new Blob([JSON.stringify(credential, null, 2)], { type: "application/ld+json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nexuswork-credential-${latest._id}.vc.jsonld`;
      link.click();
      URL.revokeObjectURL(url);
      toast.show("Signed credential exported.");
    },
    onError: (err) => toast.show(err?.message || "Could not export your credential.", { variant: "error" }),
  });

  useEffect(() => {
    if (latest?.status === "approved" && !user?.universityVerified) {
      refreshMe().catch(() => {});
    }
  }, [latest?.status, user?.universityVerified, refreshMe]);

  function resetForm() {
    setUniversityId("");
    setStudentIdNumber("");
    setProgram("");
    setUploadedDoc(null);
    setFieldErrors({});
  }

  const uploadDoc = useMutation({
    mutationFn: (file) => uploadFile(file, { relatedType: "verification_document", token }),
    onSuccess: (res) => {
      setUploadedDoc(res.data);
      setFieldErrors((prev) => ({ ...prev, document: undefined }));
    },
    onError: (err) => {
      toast.show(err?.message || "That file couldn't be uploaded. Please try again.", { variant: "error" });
    },
  });

  const removeDoc = useMutation({
    mutationFn: () => deleteFile(uploadedDoc._id, token),
    onSuccess: () => setUploadedDoc(null),
    onError: (err) => {
      toast.show(err?.message || "Couldn't remove that file — try again.", { variant: "error" });
    },
  });

  const submit = useMutation({
    mutationFn: () =>
      requestVerification(
        {
          university_id: universityId,
          full_name: fullName.trim(),
          student_id_number: studentIdNumber.trim(),
          program: program.trim(),
          document_file_id: uploadedDoc._id,
        },
        token
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-verifications"] });
      toast.show("Verification request submitted. Your university will review it shortly.");
      resetForm();
    },
    onError: (err) => {
      toast.show(err?.message || "We couldn't submit that request. Please try again.", { variant: "error" });
    },
  });

  function validate() {
    const errors = {};
    if (!universityId) errors.university = "Select your university.";
    if (!fullName.trim()) errors.fullName = "Enter your full legal name, as it appears on your ID.";
    if (!studentIdNumber.trim()) errors.studentIdNumber = "Enter your student ID number.";
    if (!program.trim()) errors.program = "Enter your program or field of study.";
    if (!uploadedDoc) errors.document = "Upload a photo of your student ID or an enrollment letter.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    submit.mutate();
  }

  const loading = universitiesLoading || verificationsLoading;
  const busy = uploadDoc.isPending || removeDoc.isPending || submit.isPending;

  return (
    <Card as="section">
      <CardHeader
        title={t("profile.universityVerification", { defaultValue: "University verification" })}
        description={t("profile.universityVerificationDescription", { defaultValue: "Verified students get a badge on their profile and proposals, and are required to be verified before submitting a proposal." })}
      />
      <CardDivider className="my-5" />

      {loading ? (
        <p className="text-sm text-slate-300">{t("common.loading")}</p>
      ) : isApproved ? (
        <>
          <Alert variant="success" title={t("profile.youAreVerified", { defaultValue: "You're verified" })}>
            {latest?.status === "approved" && latest?.university_id?.name
              ? `Confirmed by ${latest.university_id.name}. Your proposals now show a verified badge.`
              : "Your university has confirmed your enrollment. Your proposals now show a verified badge."}
          </Alert>
          {latest?._id && (
            <div className="mt-4 rounded-card border border-ink-300 bg-ink-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate">{t("profile.verifiedCredential", { defaultValue: "Verified credential" })}</p>
                  <p className="mt-1 text-xs text-slate-300">{t("profile.credentialDownloadDescription", { defaultValue: "Download a polished credential card or the signed VC/Open Badge data file." })}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => exportCredential.mutate("card")} loading={exportCredential.isPending}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download card
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exportCredential.mutate("vc")} loading={exportCredential.isPending}>
                    <FileJson className="h-4 w-4" aria-hidden="true" />
                    Signed VC
                  </Button>
                </div>
              </div>
              <CredentialCardPreview verification={latest} user={user} />
            </div>
          )}
        </>
      ) : latest?.status === "pending" ? (
        <Alert variant="warning" title={t("profile.verificationPending", { defaultValue: "Verification pending" })}>
          Your request to {latest.university_id?.name || "your university"} was submitted on{" "}
          {new Date(latest.createdAt).toLocaleDateString()} and is awaiting review. You'll be notified once it's
          decided — you can't submit proposals until it's approved.
        </Alert>
      ) : (
        <>
          {latest?.status === "rejected" && (
            <Alert variant="danger" title={t("profile.requestDeclined", { defaultValue: "Your last request was declined" })} className="mb-4">
              {latest.university_id?.name ? `${latest.university_id.name}: ` : ""}
              {latest.rejection_reason || "No reason was given."} You can fix the details and submit again below.
            </Alert>
          )}

          <p className="text-sm leading-relaxed text-slate-300">
            Submitting proposals requires an approved university verification. This goes to a real staff member at
            your school, so give them enough to confirm you're enrolled: your name as it appears on your ID, your
            student ID number, your program, your university, and a photo of your student ID or an enrollment
            letter.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select
              id="verification-university"
              label={t("profile.yourUniversity", { defaultValue: "Your university" })}
              placeholder={t("registration.selectUniversity")}
              value={universityId}
              onChange={(event) => setUniversityId(event.target.value)}
              options={universities.map((u) => ({ value: u._id, label: `${u.name} (${u.domain})` }))}
              error={fieldErrors.university}
              hint={
                universities.length === 0
                  ? "No universities are registered yet — check back soon."
                  : "Not listed? Ask your university to register on the admin side."
              }
              wrapperClassName="sm:col-span-2"
            />
            <Input
              id="verification-full-name"
              label={t("profile.fullLegalName", { defaultValue: "Full legal name" })}
              hint="As it appears on your student ID."
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              error={fieldErrors.fullName}
              maxLength={150}
            />
            <Input
              id="verification-student-id"
              label={t("registration.studentId")}
              value={studentIdNumber}
              onChange={(event) => setStudentIdNumber(event.target.value)}
              error={fieldErrors.studentIdNumber}
              maxLength={50}
            />
            <Input
              id="verification-program"
              label={t("registration.program")}
              placeholder={t("registration.programPlaceholder")}
              value={program}
              onChange={(event) => setProgram(event.target.value)}
              error={fieldErrors.program}
              maxLength={150}
              wrapperClassName="sm:col-span-2"
            />

            <div className="sm:col-span-2">
              <FileUpload
                label={t("profile.proofOfEnrollment", { defaultValue: "Proof of enrollment" })}
                hint={`Student ID card, enrollment letter, or transcript · JPG, PNG or PDF · up to ${VERIFICATION_DOC_MAX_MB} MB`}
                accept={VERIFICATION_DOC_ACCEPT}
                maxSizeMb={VERIFICATION_DOC_MAX_MB}
                disabled={busy}
                files={uploadedDoc ? [{ id: uploadedDoc._id, name: uploadedDoc.original_name, size: uploadedDoc.size }] : []}
                onFilesSelected={(files) => files[0] && uploadDoc.mutate(files[0])}
                onRemove={() => removeDoc.mutate()}
              />
              {uploadDoc.isPending && <ProgressBar className="mt-2" value={60} label={t("profile.uploadingDocument", { defaultValue: "Uploading document" })} showValue={false} />}
              {fieldErrors.document && !uploadDoc.isPending && (
                <p className="mt-2 text-xs text-brick" role="alert">
                  {fieldErrors.document}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <Button type="button" onClick={handleSubmit} loading={submit.isPending} disabled={busy || universities.length === 0}>
              Submit for review
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

function StaffVerificationCard({ user, token }) {
  const { t } = useTranslation();
  const toast = useToast();
  const qc = useQueryClient();
  const { refreshMe } = useAuth();
  const [fullName, setFullName] = useState(user?.name || "");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const { data: verificationsRes, isLoading: verificationsLoading } = useQuery({
    queryKey: ["my-staff-verifications"],
    queryFn: () => getMyStaffVerifications(token),
    enabled: !!token,
  });

  const verifications = verificationsRes?.data ?? [];
  const latest = verifications[0];
  const isApproved = latest?.status === "approved" || Boolean(user?.staffVerified);

  useEffect(() => {
    if (latest?.status === "approved" && !user?.staffVerified) {
      refreshMe().catch(() => {});
    }
  }, [latest?.status, user?.staffVerified, refreshMe]);

  function resetForm() {
    setJobTitle("");
    setDepartment("");
    setUploadedDoc(null);
    setFieldErrors({});
  }

  const uploadDoc = useMutation({
    mutationFn: (file) => uploadFile(file, { relatedType: "staff_verification_document", token }),
    onSuccess: (res) => {
      setUploadedDoc(res.data);
      setFieldErrors((prev) => ({ ...prev, document: undefined }));
    },
    onError: (err) => {
      toast.show(err?.message || "That file couldn't be uploaded. Please try again.", { variant: "error" });
    },
  });

  const removeDoc = useMutation({
    mutationFn: () => deleteFile(uploadedDoc._id, token),
    onSuccess: () => setUploadedDoc(null),
    onError: (err) => {
      toast.show(err?.message || "Couldn't remove that file — try again.", { variant: "error" });
    },
  });

  const submit = useMutation({
    mutationFn: () =>
      requestStaffVerification(
        {
          full_name: fullName.trim(),
          job_title: jobTitle.trim(),
          department: department.trim(),
          document_file_id: uploadedDoc._id,
        },
        token
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-staff-verifications"] });
      toast.show("Verification request submitted. A platform admin will review it shortly.");
      resetForm();
    },
    onError: (err) => {
      toast.show(err?.message || "We couldn't submit that request. Please try again.", { variant: "error" });
    },
  });

  function validate() {
    const errors = {};
    if (!fullName.trim()) errors.fullName = "Enter your full legal name, as it appears on your ID.";
    if (!jobTitle.trim()) errors.jobTitle = "Enter your job title.";
    if (!department.trim()) errors.department = "Enter your department.";
    if (!uploadedDoc) errors.document = "Upload a staff ID, HR/offer letter, or department directory page.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    submit.mutate();
  }

  const busy = uploadDoc.isPending || removeDoc.isPending || submit.isPending;
  const universityName = latest?.university_id?.name;

  return (
    <Card as="section">
      <CardHeader
        title={t("profile.staffVerification", { defaultValue: "Staff verification" })}
        description={t("profile.staffVerificationDescription", { defaultValue: "Secondary proof for platform admins." })}
      />
      <CardDivider className="my-5" />

      {verificationsLoading ? (
        <p className="text-sm text-slate-300">{t("common.loading")}</p>
      ) : isApproved ? (
        <Alert variant="success" title={t("profile.youAreApproved", { defaultValue: "You're approved" })}>
          {universityName
            ? `Confirmed by a platform admin for ${universityName}. You now have full staff access.`
            : "A platform admin has confirmed your staff role. You now have full staff access."}
        </Alert>
      ) : latest?.status === "pending" ? (
        <Alert variant="warning" title={t("profile.verificationPending", { defaultValue: "Verification pending" })}>
          Your request was submitted on {new Date(latest.createdAt).toLocaleDateString()} and is awaiting admin
          review.
        </Alert>
      ) : (
        <>
          {latest?.status === "rejected" && (
            <Alert variant="danger" title={t("profile.requestDeclined", { defaultValue: "Your last request was declined" })} className="mb-4">
              {latest.rejection_reason || "No reason was given."} You can fix the details and submit again below.
            </Alert>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              id="staff-verification-full-name"
              label={t("profile.fullLegalName", { defaultValue: "Full legal name" })}
              hint="As it appears on your staff ID."
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              error={fieldErrors.fullName}
              maxLength={150}
              wrapperClassName="sm:col-span-2"
            />
            <Input
              id="staff-verification-job-title"
              label={t("profile.jobTitle", { defaultValue: "Job title" })}
              placeholder={t("profile.jobTitlePlaceholder", { defaultValue: "e.g. Career Services Coordinator" })}
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              error={fieldErrors.jobTitle}
              maxLength={150}
            />
            <Input
              id="staff-verification-department"
              label={t("profile.department")}
              placeholder={t("profile.departmentPlaceholder", { defaultValue: "e.g. Office of Career Development" })}
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              error={fieldErrors.department}
              maxLength={150}
            />

            <div className="sm:col-span-2">
              <FileUpload
                label={t("profile.proofOfEmployment", { defaultValue: "Proof of employment" })}
                hint={`Staff ID, HR/offer letter, or directory page · JPG, PNG or PDF · up to ${VERIFICATION_DOC_MAX_MB} MB`}
                accept={VERIFICATION_DOC_ACCEPT}
                maxSizeMb={VERIFICATION_DOC_MAX_MB}
                disabled={busy}
                files={uploadedDoc ? [{ id: uploadedDoc._id, name: uploadedDoc.original_name, size: uploadedDoc.size }] : []}
                onFilesSelected={(files) => files[0] && uploadDoc.mutate(files[0])}
                onRemove={() => removeDoc.mutate()}
              />
              {uploadDoc.isPending && <ProgressBar className="mt-2" value={60} label={t("profile.uploadingDocument", { defaultValue: "Uploading document" })} showValue={false} />}
              {fieldErrors.document && !uploadDoc.isPending && (
                <p className="mt-2 text-xs text-brick" role="alert">
                  {fieldErrors.document}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <Button type="button" onClick={handleSubmit} loading={submit.isPending} disabled={busy}>
              Submit for review
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

function CardFooterLinks() {
  return (
    <ul className="mt-4 space-y-2.5 text-base font-semibold">
      <li>
        <Link className="text-brass underline-offset-4 hover:underline" to="/settings">
          Password &amp; security settings →
        </Link>
      </li>
      <li>
        <Link className="text-slate-300 underline-offset-4 hover:text-brass hover:underline" to="/contracts">
          View my active contracts →
        </Link>
      </li>
    </ul>
  );
}
