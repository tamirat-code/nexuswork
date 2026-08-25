import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth.js";
import { getVerificationStats } from "../../services/api/verifications.api.js";

const ROLE_LABELS = {
  student: "Student",
  client: "Client",
  university_staff: "University staff",
  admin: "Administrator",
};

const ROLE_CONFIG = {
  student: {
    heading: "Active proposals and contracts",
    body: "Track proposals you've sent, milestones in progress, and funds released to your wallet.",
    primary: { to: "/projects", label: "Browse open projects" },
    stats: [
      { label: "Open proposals", value: "—", hint: "Awaiting client review" },
      { label: "Active contracts", value: "—", hint: "Milestones in progress" },
      { label: "In escrow", value: "—", hint: "Funded, not yet released" },
    ],
    actions: [
      { to: "/projects", label: "Find work", body: "Search briefs matched to your skills." },
      { to: "/contracts", label: "My contracts", body: "Deliver milestones and request approval." },
      { to: "/wallet", label: "Wallet", body: "Track released payouts and balances." },
    ],
  },
  client: {
    heading: "Your posted projects",
    body: "Review incoming proposals, fund milestones, and approve delivered work.",
    primary: { to: "/projects/new", label: "Post a project" },
    stats: [
      { label: "Live projects", value: "—", hint: "Currently accepting proposals" },
      { label: "New proposals", value: "—", hint: "Waiting on your review" },
      { label: "Funds in escrow", value: "—", hint: "Held until you approve" },
    ],
    actions: [
      { to: "/projects/new", label: "Post a brief", body: "Describe the work and set milestones." },
      { to: "/contracts", label: "Contracts", body: "Approve deliverables and release funds." },
      { to: "/wallet", label: "Wallet", body: "Fund escrow and review payment history." },
    ],
  },
  university_staff: {
    heading: "Verification queue",
    body: "Confirm student enrollment so verified badges can appear on their proposals.",
    primary: null,
    stats: [
      { label: "Pending requests", value: "—", hint: "Students awaiting verification" },
      { label: "Approved", value: "—", hint: "Enrollments confirmed" },
      { label: "Declined", value: "—", hint: "Not confirmed by the university" },
    ],
    actions: [
      { to: "/universities", label: "Verification queue", body: "Review and confirm enrollment requests." },
      { to: "/projects", label: "Browse projects", body: "See where your students are working." },
    ],
  },
  admin: {
    heading: "Platform overview",
    body: "Monitor activity across clients, students, and universities.",
    primary: null,
    stats: [
      { label: "Active users", value: "—", hint: "Signed in last 30 days" },
      { label: "Open disputes", value: "—", hint: "Needing resolution" },
      { label: "Escrow volume", value: "—", hint: "Currently held" },
    ],
    actions: [
      { to: "/projects", label: "All projects", body: "Audit live and completed briefs." },
      { to: "/wallet", label: "Payments", body: "Review escrow and payout flows." },
    ],
  },
};

export default function DashboardPage() {
  const { user, token } = useAuth();
  const role = ROLE_CONFIG[user?.role] ? user.role : "student";
  const isUniversityStaff = role === "university_staff";

  const { data: verificationStatsRes, isLoading: statsLoading } = useQuery({
    queryKey: ["verification-stats"],
    queryFn: () => getVerificationStats(token),
    enabled: isUniversityStaff && !!token,
  });

  const config = ROLE_CONFIG[role];
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const stats =
    isUniversityStaff && verificationStatsRes
      ? config.stats.map((stat, i) => {
          const live = verificationStatsRes.data ?? {};
          const values = [live.pending, live.approved, live.rejected];
          return { ...stat, value: statsLoading ? "…" : (values[i] ?? 0) };
        })
      : config.stats;
  const pendingCount = verificationStatsRes?.data?.pending ?? 0;

  return (
    <div className="w-full">
      <header className="lm-dashboard-header flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-ink-300 bg-ink-50 px-8 py-7 shadow-card">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brass">
            {ROLE_LABELS[role]} workspace
          </p>
          <h1 className="mt-1.5 font-display font-bold leading-tight tracking-tight text-slate" style={{ fontSize: "clamp(1.375rem, 2.5vw, 1.75rem)" }}>
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">{config.body}</p>
        </div>
        {config.primary && (
          <Link
            to={config.primary.to}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-control bg-brass px-5 text-sm font-bold tracking-tight text-ink shadow-elevated transition-colors hover:bg-brass-300"
          >
            {config.primary.label}
          </Link>
        )}
      </header>

      {isUniversityStaff && !user?.staffVerified && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-card border border-brass/40 bg-brass/10 px-5 py-4">
          <div>
            <p className="text-sm font-bold tracking-tight text-brass">Staff access pending admin approval</p>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-300">
              Matching your university's email domain only confirmed eligibility to apply. Submit your staff
              ID or HR letter from your profile, and a platform admin will confirm you before you can review
              student verifications.
            </p>
          </div>
          <Link
            to="/profile"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-control bg-brass px-4 text-sm font-bold text-ink transition-colors hover:bg-brass-300"
          >
            Submit verification
          </Link>
        </div>
      )}

      <section aria-label="Overview" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-card border border-ink-300 bg-ink-50 px-5 py-4 shadow-card">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-300">{stat.label}</p>
            <p className="mt-2 font-display text-2xl font-bold leading-none tracking-tight text-slate">{stat.value}</p>
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-300">{stat.hint}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="activity-heading" className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-card border border-ink-300 bg-ink-50 p-7 shadow-card lg:col-span-2">
          <h2 id="activity-heading" className="font-display text-xl font-extrabold tracking-tight text-slate sm:text-2xl">
            {config.heading}
          </h2>
          <div className="mt-6 rounded-control border border-dashed border-ink-300 bg-ink-100 px-6 py-12 text-center">
            {isUniversityStaff && pendingCount > 0 ? (
              <>
                <p className="text-base font-bold tracking-tight text-slate sm:text-lg">
                  {pendingCount} student{pendingCount === 1 ? "" : "s"} waiting on review
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-300">
                  Confirm enrollment so these students can submit proposals and pick up work.
                </p>
                <Link
                  to="/universities"
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-control border border-ink-300 bg-ink-50 px-5 text-sm font-bold text-slate transition-colors hover:border-brass hover:text-brass"
                >
                  Go to verification queue
                </Link>
              </>
            ) : (
              <>
                <p className="text-base font-bold tracking-tight text-slate sm:text-lg">
                  {isUniversityStaff ? "All caught up" : "Nothing here yet"}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-300">
                  {isUniversityStaff
                    ? "No pending verification requests right now."
                    : "Activity will appear here as soon as there's something to show."}
                </p>
                {config.primary && (
                  <Link
                    to={config.primary.to}
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-control border border-ink-300 bg-ink-50 px-5 text-sm font-bold text-slate transition-colors hover:border-brass hover:text-brass"
                  >
                    {config.primary.label}
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        <aside className="rounded-card border border-ink-300 bg-ink-50 p-7 shadow-card">
          <h2 className="font-display text-xl font-extrabold tracking-tight text-slate">Quick actions</h2>
          <ul className="mt-5 space-y-3">
            {config.actions.map((action) => (
              <li key={action.label}>
                <Link
                  to={action.to}
                  className="block rounded-control border border-ink-300 bg-ink-100 p-4.5 transition-colors hover:border-brass/60 hover:bg-ink-50"
                >
                  <p className="text-base font-bold tracking-tight text-slate">{action.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">{action.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
}