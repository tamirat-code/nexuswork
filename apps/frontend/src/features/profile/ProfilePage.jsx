import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Textarea,
} from "../../components/ui/index.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../components/notifications/ToastProvider.jsx";
import { ROLE_LABELS } from "../../constants/roles.constants.js";
import { removeMyAvatar, updateMe, updateMyAvatar } from "../../services/api/users.api.js";
import { listUniversities } from "../../services/api/universities.api.js";
import { getMyVerifications, requestVerification } from "../../services/api/verifications.api.js";
import { uploadFile, deleteFile } from "../../services/api/files.api.js";
import AvatarUploader from "./AvatarUploader.jsx";
import { PROFILE_LIMITS, profileCompleteness, validateProfile } from "./profile.utils.js";

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

const fromUser = (user) => ({
  ...EMPTY,
  ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, user?.[k] ?? ""])),
});

export default function ProfilePage() {
  const { user, token, setLocalUser } = useAuth();
  const toast = useToast();

  const initial = useMemo(() => fromUser(user), [user]);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [summary, setSummary] = useState("");

  const dirty = useMemo(
    () => Object.keys(EMPTY).some((k) => (form[k] ?? "") !== (initial[k] ?? "")),
    [form, initial]
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

  const save = useMutation({
    mutationFn: () => {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
      );
      return updateMe(payload, token);
    },
    onSuccess: (res) => {
      const next = res?.data ?? { ...user, ...form };
      setLocalUser?.(next);
      setForm(fromUser(next));
      setTouched({});
      setSummary("");
      toast.show("Profile updated.");
    },
    onError: (err) => {
      setSummary(err?.message || "We couldn't save your profile. Please try again.");
    },
  });

  const [avatarError, setAvatarError] = useState("");

  const avatarUpload = useMutation({
    mutationFn: (dataUrl) => updateMyAvatar(dataUrl, token),
    onMutate: () => setAvatarError(""),
    onSuccess: (res, dataUrl) => {
      // Fall back to the cropped image so the UI reflects the change even when
      // the API doesn't echo the stored URL back.
      setLocalUser?.({ ...user, avatarUrl: res?.data?.avatarUrl ?? dataUrl });
      toast.show("Profile photo updated.");
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
      toast.show("Profile photo removed.");
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
    setErrors({});
    setTouched({});
    setSummary("");
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        eyebrow="Account"
        title="Profile & account"
        description="Your profile is what clients and university staff see first. Keep it accurate — a complete profile ranks higher in search and recommendations."
        breadcrumbs={[{ label: "Workspace", to: "/dashboard" }, { label: "Profile" }]}
        actions={
          <>
            <Button variant="secondary" onClick={reset} disabled={!dirty || save.isPending}>
              Discard changes
            </Button>
            <Button type="submit" form="profile-form" loading={save.isPending} disabled={!dirty}>
              Save changes
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form id="profile-form" noValidate onSubmit={handleSubmit} className="space-y-6">
          {/* Errors are announced once, in one place, before the fields. */}
          <div aria-live="polite">
            {summary && (
              <Alert live variant={save.isError ? "danger" : "warning"} title="Check your details">
                {summary}
              </Alert>
            )}
          </div>

          <Card as="section">
            <CardHeader
              title="Identity"
              description="Shown on your public profile, proposals and contracts."
            />
            <CardDivider className="my-5" />

            <div className="space-y-5">
              <div className="min-w-0">
                <p className="font-display text-lg text-slate">{form.name || "Unnamed account"}</p>
                <p className="mt-1 text-sm text-slate-300">{form.email || "No email on file"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{ROLE_LABELS[user?.role] || "Member"}</Badge>
                  {user?.universityVerified && <Badge tone="success">University verified</Badge>}
                </div>
              </div>

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
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Input
                id="profile-name"
                label="Full name"
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
                label="Email address"
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                onBlur={blur("email")}
                error={touched.email ? errors.email : undefined}
                hint="Used for sign-in and contract notices."
                autoComplete="email"
              />
              <Input
                id="profile-headline"
                label="Professional headline"
                optional
                value={form.headline}
                onChange={set("headline")}
                onBlur={blur("headline")}
                error={touched.headline ? errors.headline : undefined}
                placeholder="Final-year CS student — React & data pipelines"
                maxLength={PROFILE_LIMITS.headline}
                wrapperClassName="sm:col-span-2"
              />
            </div>
          </Card>

          {user?.role === "student" && <UniversityVerificationCard user={user} token={token} />}

          <Card as="section">
            <CardHeader title="About you" description="Context that helps clients judge fit quickly." />
            <CardDivider className="my-5" />

            <div className="grid gap-5">
              <Textarea
                id="profile-bio"
                label="Short bio"
                optional
                rows={5}
                value={form.bio}
                onChange={set("bio")}
                onBlur={blur("bio")}
                error={touched.bio ? errors.bio : undefined}
                maxLength={PROFILE_LIMITS.bio}
                showCount
                hint="Two or three sentences on what you build and the work you want."
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  id="profile-location"
                  label="Location"
                  optional
                  value={form.location}
                  onChange={set("location")}
                  onBlur={blur("location")}
                  error={touched.location ? errors.location : undefined}
                  placeholder="Addis Ababa, Ethiopia"
                  maxLength={PROFILE_LIMITS.location}
                />
                <Input
                  id="profile-university"
                  label="University"
                  optional
                  value={form.university}
                  onChange={set("university")}
                  onBlur={blur("university")}
                  error={touched.university ? errors.university : undefined}
                  maxLength={PROFILE_LIMITS.university}
                />
                <Input
                  id="profile-skills"
                  label="Skills"
                  optional
                  value={form.skills}
                  onChange={set("skills")}
                  onBlur={blur("skills")}
                  error={touched.skills ? errors.skills : undefined}
                  hint="Comma separated, e.g. React, Figma, Python"
                  maxLength={PROFILE_LIMITS.skills}
                />
                <Input
                  id="profile-website"
                  label="Portfolio or website"
                  optional
                  type="url"
                  inputMode="url"
                  value={form.website}
                  onChange={set("website")}
                  onBlur={blur("website")}
                  error={touched.website ? errors.website : undefined}
                  placeholder="https://your-portfolio.dev"
                />
              </div>
            </div>
          </Card>

          {/* Mobile action bar: the header buttons scroll away on small screens. */}
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
              title="Profile strength"
              description="Complete profiles get more invitations."
            />
            <div className="mt-5">
              <ProgressBar
                value={completeness.percent}
                label={`${completeness.done} of ${completeness.total} sections complete`}
                valueText={`${completeness.percent}% complete`}
                showValue
                tone={completeness.percent >= 80 ? "success" : completeness.percent >= 50 ? "warning" : "danger"}
              />
            </div>

            {completeness.missing.length > 0 ? (
              <>
                <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-brass">Still to add</p>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
                  {completeness.missing.map((item) => (
                    <li key={item.key} className="flex items-start gap-2">
                      <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brass" />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-300">
                Everything is filled in — nice work. Review it each term so it stays current.
              </p>
            )}
          </Card>

          <Card as="section">
            <CardHeader titleAs="h2" title="Account" description="Security and preferences live in settings." />
            <CardFooterLinks />
          </Card>
        </aside>
      </div>
    </div>
  );
}

const VERIFICATION_DOC_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const VERIFICATION_DOC_MAX_MB = 10;

function UniversityVerificationCard({ user, token }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { refreshMe } = useAuth();
  const [universityId, setUniversityId] = useState("");
  const [fullName, setFullName] = useState(user?.name || "");
  const [studentIdNumber, setStudentIdNumber] = useState("");
  const [program, setProgram] = useState("");
  const [uploadedDoc, setUploadedDoc] = useState(null); // { _id, original_name, size }
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
  // Backend returns these newest-first.
  const latest = verifications[0];

  
  const isApproved = latest?.status === "approved" || Boolean(user?.universityVerified);

  useEffect(() => {
    if (latest?.status === "approved" && !user?.universityVerified) {
      refreshMe().catch(() => {
        /* best-effort resync — the card already reflects the correct state either way */
      });
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
        title="University verification"
        description="Verified students get a badge on their profile and proposals, and are required to be verified before submitting a proposal."
      />
      <CardDivider className="my-5" />

      {loading ? (
        <p className="text-sm text-slate-300">Loading verification status…</p>
      ) : isApproved ? (
        <Alert variant="success" title="You're verified">
          {latest?.status === "approved" && latest?.university_id?.name
            ? `Confirmed by ${latest.university_id.name}. Your proposals now show a verified badge.`
            : "Your university has confirmed your enrollment. Your proposals now show a verified badge."}
        </Alert>
      ) : latest?.status === "pending" ? (
        <Alert variant="warning" title="Verification pending">
          Your request to {latest.university_id?.name || "your university"} was submitted on{" "}
          {new Date(latest.createdAt).toLocaleDateString()} and is awaiting review. You'll be notified once it's
          decided — you can't submit proposals until it's approved.
        </Alert>
      ) : (
        <>
          {latest?.status === "rejected" && (
            <Alert variant="danger" title="Your last request was declined" className="mb-4">
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

          {/* Not a <form>: this card is nested inside the page's main profile
              <form>, and HTML doesn't allow forms inside forms. */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select
              id="verification-university"
              label="Your university"
              placeholder="Select your university"
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
              label="Full legal name"
              hint="As it appears on your student ID."
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              error={fieldErrors.fullName}
              maxLength={150}
            />
            <Input
              id="verification-student-id"
              label="Student ID number"
              value={studentIdNumber}
              onChange={(event) => setStudentIdNumber(event.target.value)}
              error={fieldErrors.studentIdNumber}
              maxLength={50}
            />
            <Input
              id="verification-program"
              label="Program / field of study"
              placeholder="e.g. B.Sc. Computer Science"
              value={program}
              onChange={(event) => setProgram(event.target.value)}
              error={fieldErrors.program}
              maxLength={150}
              wrapperClassName="sm:col-span-2"
            />

            <div className="sm:col-span-2">
              <FileUpload
                label="Proof of enrollment"
                hint={`Student ID card, enrollment letter, or transcript · JPG, PNG or PDF · up to ${VERIFICATION_DOC_MAX_MB} MB`}
                accept={VERIFICATION_DOC_ACCEPT}
                maxSizeMb={VERIFICATION_DOC_MAX_MB}
                disabled={busy}
                files={uploadedDoc ? [{ id: uploadedDoc._id, name: uploadedDoc.original_name, size: uploadedDoc.size }] : []}
                onFilesSelected={(files) => files[0] && uploadDoc.mutate(files[0])}
                onRemove={() => removeDoc.mutate()}
              />
              {uploadDoc.isPending && <ProgressBar className="mt-2" value={60} label="Uploading document" showValue={false} />}
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

function CardFooterLinks() {
  return (
    <ul className="mt-4 space-y-2 text-sm">
      <li>
        <Link className="text-brass underline-offset-4 hover:underline" to="/settings">
          Password &amp; security
        </Link>
      </li>
      <li>
        <Link className="text-brass underline-offset-4 hover:underline" to="/notifications">
          Notification preferences
        </Link>
      </li>
    </ul>
  );
}