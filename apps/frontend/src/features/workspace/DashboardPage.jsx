import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Wallet, PlusCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../../hooks/useAuth.js";
import { getVerificationStats } from "../../services/api/verifications.api.js";
import { getMyAnalytics } from "../../services/api/analytics.api.js";
import { listMyProposals, listIncomingProposals } from "../../services/api/proposals.api.js";
import { listMyContracts } from "../../services/api/contracts.api.js";
import { getMyWallet } from "../../services/api/wallets.api.js";
import { listAdminStats } from "../../services/api/admin.api.js";
import { formatCurrency } from "../../utils/currency.utils.js";
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
      { label: "Platform commission", value: "$0", hint: "Recorded successful commission", icon: Wallet },
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
  const isStudent = role === "student";
  const isClient = role === "client";
  const isAdmin = role === "admin";

  const { data: userMetricsRes, isLoading: userMetricsLoading } = useQuery({
    queryKey: ["dashboard-user-metrics", user?._id],
    queryFn: () => getMyAnalytics(token),
    enabled: !!token && (isStudent || isClient),
  });
  const { data: myProposalsRes, isLoading: myProposalsLoading } = useQuery({
    queryKey: ["dashboard-my-proposals"],
    queryFn: () => listMyProposals(token),
    enabled: !!token && isStudent,
  });
  const { data: incomingProposalsRes, isLoading: incomingProposalsLoading } = useQuery({
    queryKey: ["dashboard-incoming-proposals"],
    queryFn: () => listIncomingProposals(token),
    enabled: !!token && isClient,
  });
  const { data: contractsRes, isLoading: contractsLoading } = useQuery({
    queryKey: ["dashboard-contracts"],
    queryFn: () => listMyContracts(token),
    enabled: !!token && (isStudent || isClient),
  });
  const { data: walletRes, isLoading: walletLoading } = useQuery({
    queryKey: ["dashboard-wallet"],
    queryFn: () => getMyWallet(token),
    enabled: !!token && (isStudent || isClient),
  });
  const { data: adminStatsRes, isLoading: adminStatsLoading } = useQuery({
    queryKey: ["dashboard-admin-stats"],
    queryFn: () => listAdminStats(token),
    enabled: !!token && isAdmin,
  });

  const { data: verificationStatsRes, isLoading: statsLoading } = useQuery({
    queryKey: ["verification-stats"],
    queryFn: () => getVerificationStats(token),
    enabled: isUniversityStaff && !!token,
  });

  const config = ROLE_CONFIG[role];
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const userMetrics = userMetricsRes?.data ?? {};
  const proposals = myProposalsRes?.data ?? [];
  const incomingProposals = incomingProposalsRes?.data ?? [];
  const contracts = contractsRes?.data ?? [];
  const wallet = walletRes?.data ?? {};
  const adminStats = adminStatsRes?.data ?? {};
  const liveStats = isStudent
    ? [
        proposals.filter((proposal) => proposal.status === "pending").length,
        contracts.filter((contract) => ["active", "pending_signature", "pending_review"].includes(contract.status)).length,
        wallet.pending ?? 0,
      ]
    : isClient
      ? [
          userMetrics.projects_posted ?? 0,
          incomingProposals.filter((proposal) => proposal.status === "pending").length,
          wallet.pending ?? 0,
        ]
      : isAdmin
        ? [
            adminStats.users?.active_30d ?? 0,
            adminStats.disputes?.open ?? 0,
            adminStats.revenue?.commission_total ?? 0,
          ]
        : null;
  const liveLoading = userMetricsLoading || myProposalsLoading || incomingProposalsLoading || contractsLoading || walletLoading || adminStatsLoading;
  const activityItems = isStudent
    ? [
        ...proposals.slice(0, 3).map((proposal) => ({
          key: `proposal-${proposal._id}`,
          title: proposal.project_id?.title || "Proposal",
          detail: `Proposal · ${proposal.status || "pending"}`,
          to: "/proposals",
        })),
        ...contracts.slice(0, 3).map((contract) => ({
          key: `contract-${contract._id}`,
          title: contract.project_id?.title || contract.terms?.title || "Contract",
          detail: `Contract · ${contract.status || "pending"}`,
          to: `/contracts/${contract._id}`,
        })),
      ].slice(0, 5)
    : isClient
      ? [
          ...incomingProposals.slice(0, 3).map((proposal) => ({
            key: `proposal-${proposal._id}`,
            title: proposal.project_id?.title || "Incoming proposal",
            detail: `Proposal from ${proposal.student_id?.name || "student"} · ${proposal.status || "pending"}`,
            to: "/proposals",
          })),
          ...contracts.slice(0, 3).map((contract) => ({
            key: `contract-${contract._id}`,
            title: contract.project_id?.title || contract.terms?.title || "Contract",
            detail: `Contract · ${contract.status || "pending"}`,
            to: `/contracts/${contract._id}`,
          })),
        ].slice(0, 5)
      : [];
  const chartColors = ["#00a896", "#547bff", "#d9a441", "#e56b6f", "#8b9aa8"];
  const dashboardChart = isStudent
    ? {
        title: "Your work pipeline",
        data: ["pending", "accepted", "rejected", "withdrawn"].map((status) => ({
          name: status,
          value: proposals.filter((proposal) => proposal.status === status).length,
        })).filter((item) => item.value > 0),
      }
    : isClient
      ? {
          title: "Proposal pipeline",
          data: ["pending", "accepted", "rejected"].map((status) => ({
            name: status,
            value: incomingProposals.filter((proposal) => proposal.status === status).length,
          })).filter((item) => item.value > 0),
        }
      : isUniversityStaff
        ? {
            title: "Verification pipeline",
            data: [
              { name: "Pending", value: verificationStatsRes?.data?.pending ?? 0 },
              { name: "Approved", value: verificationStatsRes?.data?.approved ?? 0 },
              { name: "Declined", value: verificationStatsRes?.data?.rejected ?? 0 },
            ].filter((item) => item.value > 0),
          }
        : {
            title: "Platform users",
            data: (adminStats.users?.by_role || []).map((item) => ({
              name: String(item._id || "unknown").replaceAll("_", " "),
              value: item.count,
            })).filter((item) => item.value > 0),
          };

  const stats =
    isUniversityStaff && verificationStatsRes
      ? config.stats.map((stat, i) => {
          const live = verificationStatsRes.data ?? {};
          const values = [live.pending, live.approved, live.rejected];
          return { ...stat, value: statsLoading ? "…" : String(values[i] ?? 0) };
        })
      : liveStats
        ? config.stats.map((stat, i) => ({ ...stat, value: liveLoading ? "…" : i === 2 && isAdmin ? formatCurrency(liveStats[i], adminStats.revenue?.currency || "USD") : String(liveStats[i]) }))
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

      <section aria-label="Dashboard analytics" className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-base font-bold tracking-tight text-content-primary sm:text-lg">{dashboardChart.title}</h2>
          <div className="mt-3 h-56">
            {liveLoading ? (
              <div className="grid h-full place-items-center text-sm text-content-muted">Loading live data…</div>
            ) : dashboardChart.data.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dashboardChart.data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>
                    {dashboardChart.data.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#10232d", border: "1px solid #29434c", borderRadius: 8, color: "#f4f7f6" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-content-muted">No data yet.</div>
            )}
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-base font-bold tracking-tight text-content-primary sm:text-lg">Live data sources</h2>
          <div className="mt-4 space-y-3 text-sm text-content-secondary">
            <p>Metrics update from your authenticated workspace data.</p>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span>Records shown</span>
              <span className="font-semibold text-content-primary">{activityItems.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last loaded</span>
              <span className="font-semibold text-brand">{liveLoading ? "Loading…" : "Live"}</span>
            </div>
          </div>
        </Card>
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
            ) : activityItems.length > 0 ? (
              <div className="space-y-3">
                {activityItems.map((item) => (
                  <Link key={item.key} to={item.to} className="flex items-center justify-between rounded-control border border-border p-4 transition-colors hover:border-brand/40 hover:bg-brand-soft/40">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-content-primary">{item.title}</p>
                      <p className="mt-1 text-xs capitalize text-content-secondary">{item.detail}</p>
                    </div>
                    <span className="ml-4 text-sm font-semibold text-brand">View →</span>
                  </Link>
                ))}
              </div>
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
