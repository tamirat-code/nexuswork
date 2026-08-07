import { 
      
  Globe, Lock, AlertCircle 
} from "lucide-react";

// Custom SVGs for brand icons (Lucide removed them for trademark reasons)
const GithubIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const LinkedinIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const UNIVERSITIES = [
  "Addis Ababa University",
  "Addis Ababa Science and Technology University",
  "Addis Ababa Institute of Technology",
  "Bahir Dar University",
  "Jimma University",
  "Mekelle University",
  "Hawassa University",
  "Other",
];

const INDUSTRIES = [
  "Technology", "Education", "Finance", "Healthcare", "NGO", "Government", "Other"
];

const COMPANY_SIZES = [
  "1-10", "11-50", "51-200", "201-1000", "1000+"
];

export default function RoleSpecificStep({ role, register, errors }) {
  if (role === "student") return <StudentForm register={register} errors={errors} />;
  if (role === "client") return <ClientForm register={register} errors={errors} />;
  if (role === "admin") return <AdminForm register={register} errors={errors} />;  // ← ADD
  return <UniversityForm register={register} errors={errors} />;
}


function StudentForm({ register, errors }) {
  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
        Student Information
      </h2>
      <p className="mb-8 text-sm text-slate-500 dark:text-zinc-400">
        Help us verify your student status and match you to relevant projects.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Student ID *" error={errors.studentId}>
            <input {...register("studentId")} placeholder="UGR/1234/14" className={inputClass(errors.studentId)} />
          </Field>
          <Field label="University *" error={errors.university}>
            <select {...register("university")} className={inputClass(errors.university)}>
              <option value="">Select university</option>
              {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="College *" error={errors.college}>
            <input {...register("college")} placeholder="College of Engineering" className={inputClass(errors.college)} />
          </Field>
          <Field label="Department *" error={errors.department}>
            <input {...register("department")} placeholder="Software Engineering" className={inputClass(errors.department)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Program *" error={errors.program}>
            <input {...register("program")} placeholder="B.Sc." className={inputClass(errors.program)} />
          </Field>
          <Field label="Year of Study *" error={errors.yearOfStudy}>
            <input {...register("yearOfStudy", { valueAsNumber: true })} type="number" min="1" max="8" placeholder="3" className={inputClass(errors.yearOfStudy)} />
          </Field>
          <Field label="Graduation Year *" error={errors.graduationYear}>
            <input {...register("graduationYear", { valueAsNumber: true })} type="number" min="2024" max="2035" placeholder="2027" className={inputClass(errors.graduationYear)} />
          </Field>
        </div>

        <Field label="CGPA (optional)" error={errors.cgpa}>
          <input {...register("cgpa", { valueAsNumber: true })} type="number" step="0.01" min="0" max="4" placeholder="3.75" className={inputClass(errors.cgpa)} />
        </Field>

        <div className="border-t border-slate-200 pt-4 dark:border-white/10">
          <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-zinc-300">
            Online Profiles (optional)
          </p>
          <div className="space-y-3">
            <div className="relative">
              <GithubIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input {...register("githubProfile")} placeholder="https://github.com/username" className={inputClass(errors.githubProfile) + " pl-10"} />
            </div>
            <div className="relative">
              <LinkedinIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input {...register("linkedinProfile")} placeholder="https://linkedin.com/in/username" className={inputClass(errors.linkedinProfile) + " pl-10"} />
            </div>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input {...register("portfolioWebsite")} placeholder="https://your-portfolio.com" className={inputClass(errors.portfolioWebsite) + " pl-10"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientForm({ register, errors }) {
  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
        Company Information
      </h2>
      <p className="mb-8 text-sm text-slate-500 dark:text-zinc-400">
        Tell us about your organization so we can match you with the right talent.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company Name *" error={errors.companyName}>
            <input {...register("companyName")} placeholder="Acme Corp" className={inputClass(errors.companyName)} />
          </Field>
          <Field label="Job Title *" error={errors.jobTitle}>
            <input {...register("jobTitle")} placeholder="Product Manager" className={inputClass(errors.jobTitle)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company Email *" error={errors.companyEmail}>
            <input {...register("companyEmail")} type="email" placeholder="you@company.com" className={inputClass(errors.companyEmail)} />
          </Field>
          <Field label="Industry *" error={errors.industry}>
            <select {...register("industry")} className={inputClass(errors.industry)}>
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company Size *" error={errors.companySize}>
            <select {...register("companySize")} className={inputClass(errors.companySize)}>
              <option value="">Select size</option>
              {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
            </select>
          </Field>
          <Field label="Company Website" error={errors.companyWebsite}>
            <input {...register("companyWebsite")} placeholder="https://company.com" className={inputClass(errors.companyWebsite)} />
          </Field>
        </div>
      </div>
    </div>
  );
}
function AdminForm({ register, errors }) {
  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
        Administrator Verification
      </h2>
      <p className="mb-8 text-sm text-slate-500 dark:text-zinc-400">
        Admin access is restricted. Enter your authorized access code to continue.
      </p>

      <div className="space-y-4">
        <Field label="Admin Access Code *" error={errors.adminCode}>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              {...register("adminCode")}
              type="password"
              placeholder="Enter your admin access code"
              className={inputClass(errors.adminCode) + " pl-10"}
              autoComplete="off"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400 dark:text-zinc-500">
            Use <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-blue-600 dark:bg-white/10 dark:text-blue-400">NEXUS2026</code> for demo access.
          </p>
        </Field>

        <Field label="Job Title *" error={errors.adminTitle}>
          <input
            {...register("adminTitle")}
            placeholder="e.g., Platform Operations Lead"
            className={inputClass(errors.adminTitle)}
          />
        </Field>
      </div>

      {/* Warning banner */}
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-50 p-4 dark:bg-amber-500/10">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Elevated privileges
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            Admin accounts can manage users, resolve disputes, and access audit logs. All actions are logged.
          </p>
        </div>
      </div>
    </div>
  );
}

function UniversityForm({ register, errors }) {
  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
        University Staff Information
      </h2>
      <p className="mb-8 text-sm text-slate-500 dark:text-zinc-400">
        Your official university email will be used for verification.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Staff ID *" error={errors.staffId}>
            <input {...register("staffId")} placeholder="STF/1234" className={inputClass(errors.staffId)} />
          </Field>
          <Field label="Position *" error={errors.position}>
            <input {...register("position")} placeholder="Registrar Officer" className={inputClass(errors.position)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="University *" error={errors.university}>
            <select {...register("university")} className={inputClass(errors.university)}>
              <option value="">Select university</option>
              {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="Faculty *" error={errors.faculty}>
            <input {...register("faculty")} placeholder="Faculty of Technology" className={inputClass(errors.faculty)} />
          </Field>
        </div>

        <Field label="Department *" error={errors.department}>
          <input {...register("department")} placeholder="Registrar Office" className={inputClass(errors.department)} />
        </Field>

        <Field label="Official University Email *" error={errors.officialEmail}>
          <input {...register("officialEmail")} type="email" placeholder="you@aau.edu.et" className={inputClass(errors.officialEmail)} />
          <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
            Must end with your university's official domain
          </p>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  );
}

function inputClass(error) {
  return `w-full rounded-lg border bg-white py-2.5 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-zinc-600 ${
    error ? "border-red-500" : "border-slate-300 dark:border-white/10"
  }`;
}