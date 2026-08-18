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
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-300 pb-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">
            {ROLE_LABELS[role]} workspace
          </p>
          <h1 className="mt-2 font-display text-[28px] leading-tight tracking-tight text-white sm:text-[32px]">
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">{config.body}</p>
        </div>
        {config.primary && (
          <Link
            to={config.primary.to}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-control bg-brass px-5 text-sm font-semibold tracking-tight text-ink shadow-card transition-colors hover:bg-brass-300"
          >
            {config.primary.label}
          </Link>
        )}
      </header>

      <section aria-label="Overview" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-card border border-ink-300 bg-ink-50 p-5 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">{stat.label}</p>
            <p className="mt-3 font-display text-3xl leading-none tracking-tight text-white">{stat.value}</p>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-300">{stat.hint}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="activity-heading" className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="rounded-card border border-ink-300 bg-ink-50 p-6 shadow-card lg:col-span-2">
          <h2 id="activity-heading" className="font-display text-lg tracking-tight text-white">
            {config.heading}
          </h2>
          <div className="mt-5 rounded-control border border-dashed border-ink-300 bg-ink-100 px-5 py-10 text-center">
            {isUniversityStaff && pendingCount > 0 ? (
              <>
                <p className="text-sm font-semibold tracking-tight text-slate">
                  {pendingCount} student{pendingCount === 1 ? "" : "s"} waiting on review
                </p>
                <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-300">
                  Confirm enrollment so these students can submit proposals and pick up work.
                </p>
                <Link
                  to="/universities"
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-control border border-ink-300 px-4 text-[13px] font-semibold text-slate transition-colors hover:border-brass hover:text-white"
                >
                  Go to verification queue
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold tracking-tight text-slate">
                  {isUniversityStaff ? "All caught up" : "Nothing here yet"}
                </p>
                <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-300">
                  {isUniversityStaff
                    ? "No pending verification requests right now."
                    : "Activity will appear here as soon as there's something to show."}
                </p>
                {config.primary && (
                  <Link
                    to={config.primary.to}
                    className="mt-5 inline-flex h-10 items-center justify-center rounded-control border border-ink-300 px-4 text-[13px] font-semibold text-slate transition-colors hover:border-brass hover:text-white"
                  >
                    {config.primary.label}
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        <aside className="rounded-card border border-ink-300 bg-ink-50 p-6 shadow-card">
          <h2 className="font-display text-lg tracking-tight text-white">Quick actions</h2>
          <ul className="mt-4 space-y-2.5">
            {config.actions.map((action) => (
              <li key={action.label}>
                <Link
                  to={action.to}
                  className="block rounded-control border border-ink-300 bg-ink-100 p-4 transition-colors hover:border-brass"
                >
                  <p className="text-sm font-semibold tracking-tight text-slate">{action.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">{action.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
}