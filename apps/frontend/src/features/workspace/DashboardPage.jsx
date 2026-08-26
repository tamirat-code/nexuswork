import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Wallet, PlusCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { getVerificationStats } from "../../services/api/verifications.api.js";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Stat, { StatGrid } from "../../components/ui/Stat.jsx";
import ActionCard from "../../components/ui/ActionCard.jsx";
import EmptyState from "../../components/feedback/States.jsx";

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
      { label: "Open proposals", value: "0", hint: "Awaiting client review", icon: FileText },
      { label: "Active contracts", value: "0", hint: "Milestones in progress", icon: Briefcase },
      { label: "In escrow", value: "$0", hint: "Funded, not yet released", icon: Wallet },
    ],
    actions: [
      { to: "/projects", label: "Find work", body: "Search briefs matched to your skills.", icon: Briefcase },
      { to: "/contracts", label: "My contracts", body: "Deliver milestones and request approval.", icon: FileText },
      { to: "/wallet", label: "Wallet", body: "Track released payouts and balances.", icon: Wallet },
    ],
  },
  client: {
    heading: "Your posted projects",
    body: "Review incoming proposals, fund milestones, and approve delivered work.",
    primary: { to: "/projects/new", label: "Post a project" },
    stats: [
      { label: "Live projects", value: "0", hint: "Currently accepting proposals", icon: Briefcase },
      { label: "New proposals", value: "0", hint: "Waiting on your review", icon: FileText },
      { label: "Funds in escrow", value: "$0", hint: "Held until you approve", icon: Wallet },
    ],
    actions: [
      { to: "/projects/new", label: "Post a brief", body: "Describe the work and set milestones.", icon: PlusCircle },
      { to: "/contracts", label: "Contracts", body: "Approve deliverables and release funds.", icon: FileText },
      { to: "/wallet", label: "Wallet", body: "Fund escrow and review payment history.", icon: Wallet },
    ],
  },
  university_staff: {
    heading: "Verification queue",
    body: "Confirm student enrollment so verified badges can appear on their proposals.",
    primary: null,
    stats: [
      { label: "Pending requests", value: "0", hint: "Students awaiting verification", icon: ShieldAlert },
      { label: "Approved", value: "0", hint: "Enrollments confirmed", icon: CheckCircle2 },
      { label: "Declined", value: "0", hint: "Not confirmed by the university", icon: ShieldAlert },
    ],
    actions: [
      { to: "/universities", label: "Verification queue", body: "Review and confirm enrollment requests.", icon: ShieldAlert },
      { to: "/projects", label: "Browse projects", body: "See where your students are working.", icon: Briefcase },
    ],
  },
  admin: {
    heading: "Platform overview",
    body: "Monitor activity across clients, students, and universities.",
    primary: null,
    stats: [
      { label: "Active users", value: "0", hint: "Signed in last 30 days", icon: Briefcase },
      { label: "Open disputes", value: "0", hint: "Needing resolution", icon: ShieldAlert },
      { label: "Escrow volume", value: "$0", hint: "Currently held", icon: Wallet },
    ],
    actions: [
      { to: "/projects", label: "All projects", body: "Audit live and completed briefs.", icon: Briefcase },
      { to: "/wallet", label: "Payments", body: "Review escrow and payout flows.", icon: Wallet },
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
          return { ...stat, value: statsLoading ? "…" : String(values[i] ?? 0) };
        })
      : config.stats;
  const pendingCount = verificationStatsRes?.data?.pending ?? 0;

  return (
    <div className="w-full space-y-6">
      {/* ── Welcome Banner ── */}
      <header className="lm-dashboard-header flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-surface p-6 shadow-card sm:p-7">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
            {ROLE_LABELS[role]} Workspace
          </span>
          <h1 className="mt-2 font-display text-xl font-bold tracking-tight text-content-primary sm:text-2xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-content-secondary sm:text-sm">
            {config.body}
          </p>
        </div>
        {config.primary && (
          <Link to={config.primary.to}>
            <Button size="md">{config.primary.label}</Button>
          </Link>
        )}
      </header>

      {/* ── University Staff Verification Alert ── */}
      {isUniversityStaff && !user?.staffVerified && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-brand/30 bg-brand-soft p-5">
          <div>
            <p className="text-sm font-bold tracking-tight text-brand">Staff access pending admin approval</p>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-content-secondary">
              Matching your university's email domain only confirmed eligibility. Submit your staff ID or HR letter from your profile so an admin can approve your account.
            </p>
          </div>
          <Link to="/profile">
            <Button size="sm">Submit verification</Button>
          </Link>
        </div>
      )}

      {/* ── Metrics Grid ── */}
      <section aria-label="Overview">
        <StatGrid>
          {stats.map((stat) => (
            <Stat
              key={stat.label}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
              icon={stat.icon}
            />
          ))}
        </StatGrid>
      </section>

      {/* ── Main Activity Grid ── */}
      <section aria-labelledby="activity-heading" className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <h2 id="activity-heading" className="font-display text-base font-bold tracking-tight text-content-primary sm:text-lg mb-4">
              {config.heading}
            </h2>

            {isUniversityStaff && pendingCount > 0 ? (
              <EmptyState
                icon={ShieldAlert}
                title={`${pendingCount} student${pendingCount === 1 ? "" : "s"} waiting on review`}
                description="Confirm enrollment so these students can submit proposals and pick up work."
                action={
                  <Link to="/universities">
                    <Button size="sm">Go to verification queue</Button>
                  </Link>
                }
              />
            ) : (
              <EmptyState
                icon={Briefcase}
                title={isUniversityStaff ? "All caught up" : "No active items yet"}
                description={
                  isUniversityStaff
                    ? "No pending verification requests right now."
                    : "Activity will appear here as soon as proposals are submitted or contracts begin."
                }
                action={
                  config.primary ? (
                    <Link to={config.primary.to}>
                      <Button size="sm">{config.primary.label}</Button>
                    </Link>
                  ) : null
                }
              />
            )}
          </Card>
        </div>

        {/* ── Quick Actions Column ── */}
        <div>
          <Card className="h-full">
            <h2 className="font-display text-base font-bold tracking-tight text-content-primary mb-4">
              Quick actions
            </h2>
            <div className="space-y-3">
              {config.actions.map((action) => (
                <ActionCard
                  key={action.label}
                  to={action.to}
                  title={action.label}
                  description={action.body}
                  icon={action.icon}
                />
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}