import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Wallet, PlusCircle, CheckCircle2, ShieldAlert, ArrowUpRight, ChevronRight, Clock3, CircleCheck, Image as ImageIcon } from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../../hooks/useAuth.js";
import { getVerificationStats } from "../../services/api/verifications.api.js";
import { getMyAnalytics } from "../../services/api/analytics.api.js";
import { listMyProposals, listIncomingProposals } from "../../services/api/proposals.api.js";
import { listMyContracts } from "../../services/api/contracts.api.js";
import { getMyWallet } from "../../services/api/wallets.api.js";
import { getMyPortfolio } from "../../services/api/portfolios.api.js";
import { listAdminStats } from "../../services/api/admin.api.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { chartColors, chartTooltipStyle } from "../../lib/chartStyles.js";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Stat, { StatGrid } from "../../components/ui/Stat.jsx";
import ActionCard from "../../components/ui/ActionCard.jsx";
import EmptyState from "../../components/feedback/States.jsx";
import { useTranslation } from "react-i18next";

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

function formatMultiCurrency(values, fallback, fallbackCurrency = "USD") {
  const entries = Object.entries(values || {}).filter(([, amount]) => amount != null);
  if (!entries.length) return formatCurrency(fallback ?? 0, fallbackCurrency);
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amount]) => formatCurrency(amount, currency.toUpperCase()))
    .join(" · ");
}

function StudentDashboard({ user, firstName, proposals, contracts, wallet, userMetrics, portfolio, loading }) {
  const { t } = useTranslation();
  const copy = (key, options) => t(`dashboardVisual.${key}`, options);
  const activeContract = contracts.find((contract) => ["active", "pending_signature", "pending_review"].includes(contract.status));
  const recentItems = [
    ...proposals.map((proposal) => ({
      id: `proposal-${proposal._id}`,
      title: proposal.project_id?.title || copy("untitledProject"),
      detail: `${proposal.status || "pending"} proposal`,
      status: proposal.status === "accepted" ? copy("accepted") : proposal.status === "rejected" ? copy("closed") : copy("inReview"),
      to: "/proposals",
    })),
    ...contracts.map((contract) => ({
      id: `contract-${contract._id}`,
      title: contract.project_id?.title || contract.terms?.title || copy("untitledProject"),
      detail: `${contract.status || "active"} contract`,
      status: contract.status === "completed" ? copy("done") : copy("inProgress"),
      to: `/contracts/${contract._id}`,
    })),
  ].slice(0, 4);
  const todoItems = [
    activeContract && { title: activeContract.project_id?.title || activeContract.terms?.title || copy("activeContract"), detail: copy("continueWork"), to: `/contracts/${activeContract._id}`, done: false },
    proposals.find((proposal) => proposal.status === "pending") && { title: copy("followUp"), detail: copy("clientReview"), to: "/proposals", done: false },
    { title: copy("completeProfile"), detail: copy("addSkills"), to: "/profile", done: Boolean(user?.profileCompleted) },
  ].filter(Boolean).slice(0, 3);
  const portfolioItems = Array.isArray(portfolio) ? portfolio.slice(0, 3) : [];
  const avatarUrl = user?.avatarUrl || user?.avatar || user?.profile?.avatar;
  const initials = (user?.name || "Student").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const income = userMetrics?.earnings ?? userMetrics?.total_earnings ?? wallet?.released ?? 0;
  const incomeCurrency = wallet?.currency || userMetrics?.currency || "USD";

  return (
    <div className="-mx-3 min-h-[calc(100vh-5rem)] bg-[#f7f5f2] px-3 py-4 text-[#2d2927] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a8f87]">{copy("eyebrow")}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{copy("greeting", { name: firstName })}</h1>
          </div>
          <Link to="/profile" className="hidden items-center gap-3 rounded-full bg-white p-1.5 pr-4 shadow-sm ring-1 ring-black/5 sm:flex">
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-black/5" /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-[#d8f4c0] text-xs font-bold text-[#456f30]">{initials}</span>}
            <span className="text-sm font-semibold">{copy("viewProfile")}</span>
            <ArrowUpRight className="h-4 w-4 text-[#9a8f87]" />
          </Link>
        </div>

        <section className="grid gap-5 xl:grid-cols-[1.05fr_1fr_0.88fr]">
          <Card
            className="relative min-h-[290px] overflow-hidden border-0 bg-[#284b43] bg-cover bg-center text-white shadow-lg"
            style={avatarUrl ? { backgroundImage: `url("${avatarUrl}")` } : undefined}
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,63,56,.98)_0%,rgba(27,78,67,.82)_48%,rgba(27,78,67,.38)_100%)]" />
            <div className="absolute -right-10 -top-12 h-48 w-48 rounded-full bg-[#b7ec8c]/20 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-white/70">{copy("profile")}</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white">{user?.name || "Student"}</h2>
                  <p className="mt-1 text-sm text-white/70">{user?.headline || user?.program || copy("studentFreelancer")}</p>
                </div>
                {avatarUrl ? <img src={avatarUrl} alt={user.name || ""} className="h-20 w-20 rounded-2xl object-cover object-center ring-2 ring-white/40 shadow-lg" /> : <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white/15 text-xl font-bold text-white">{initials}</div>}
              </div>
              <div className="grid grid-cols-3 gap-2 pt-8">
                {[[proposals.length, copy("proposals")], [contracts.length, copy("contracts")], [portfolio.length, copy("portfolio")]].map(([value, label]) => (
                  <div key={label} className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                    <p className="text-xl font-bold">{value}</p><p className="mt-1 text-[11px] text-white/65">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="min-h-[290px] border-0 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-semibold text-[#766c65]">{copy("income")}</p><p className="mt-2 font-display text-4xl font-bold">{formatCurrency(income, incomeCurrency)}</p></div>
              <span className="rounded-full bg-[#f1eee9] px-3 py-1 text-xs font-semibold text-[#766c65]">{copy("allTime")}</span>
            </div>
            <div className="mt-8 h-32 rounded-xl bg-gradient-to-t from-[#fff3ed] to-transparent p-2">
              <svg viewBox="0 0 420 115" className="h-full w-full" role="img" aria-label={copy("incomeTrend")}>
                <path d="M0 92 C35 82 48 98 83 76 S135 68 170 80 S218 42 250 60 S295 95 323 66 S365 22 420 45" fill="none" stroke="#ef7651" strokeWidth="4" strokeLinecap="round" />
                <path d="M0 92 C35 82 48 98 83 76 S135 68 170 80 S218 42 250 60 S295 95 323 66 S365 22 420 45 V115 H0Z" fill="url(#incomeFill)" opacity=".65" />
                <defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ef7651" stopOpacity=".28" /><stop offset="1" stopColor="#ef7651" stopOpacity="0" /></linearGradient></defs>
              </svg>
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-[#a69c95]"><span>Jan</span><span>Apr</span><span>Jul</span><span>Now</span></div>
          </Card>

          <Card className="min-h-[290px] border-0 bg-[#302c2b] text-white shadow-sm">
            <p className="text-sm font-semibold text-white/65">{copy("current")}</p>
            {loading ? <div className="mt-8 text-sm text-white/60">{copy("loadingWork")}</div> : activeContract ? (
              <Link to={`/contracts/${activeContract._id}`} className="mt-7 block">
                <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#b7ec8c] text-[#284b43]"><Briefcase className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate font-semibold">{activeContract.project_id?.title || activeContract.terms?.title || copy("activeContract")}</p><p className="mt-1 text-xs text-white/55">{activeContract.status || copy("inProgress")}</p></div></div>
                <div className="mt-10 h-2 rounded-full bg-white/15"><div className="h-full w-3/5 rounded-full bg-[#ef7651]" /></div><div className="mt-2 flex justify-between text-xs text-white/55"><span>{copy("inProgress")}</span><span>60%</span></div>
              </Link>
            ) : <div className="mt-8"><p className="text-xl font-semibold">{copy("noActiveContract")}</p><p className="mt-2 text-sm leading-relaxed text-white/60">{copy("noActiveContractHint")}</p><Link to="/projects" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#b7ec8c] px-4 py-2.5 text-sm font-bold text-[#284b43]">{copy("findWork")} <ArrowUpRight className="h-4 w-4" /></Link></div>}
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr_0.8fr]">
          <Card className="border-0 bg-white shadow-sm"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">{copy("recentProjects")}</h2><Link to="/proposals" className="text-xs font-semibold text-[#ef7651]">{copy("viewAll")}</Link></div><div className="mt-4 space-y-2">{recentItems.length ? recentItems.map((item) => <Link key={item.id} to={item.to} className="flex items-center justify-between gap-3 rounded-2xl bg-[#faf9f7] p-4 transition hover:bg-[#f2eee9]"><div className="min-w-0"><div className="flex items-center gap-2"><span className="rounded-full bg-[#f7d6c8] px-2 py-1 text-[10px] font-bold text-[#9c4b32]">{item.status}</span></div><p className="mt-2 truncate text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-[#9a8f87]">{item.detail}</p></div><ChevronRight className="h-4 w-4 shrink-0 text-[#b0a59e]" /></Link>) : <div className="rounded-2xl bg-[#faf9f7] p-6 text-sm text-[#9a8f87]">{copy("yourActivity")}</div>}</div></Card>

          <Card className="border-0 bg-white shadow-sm"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">{copy("todo")}</h2><Link to="/profile" className="grid h-8 w-8 place-items-center rounded-xl bg-[#f5f2ee] text-[#766c65]"><ArrowUpRight className="h-4 w-4" /></Link></div><div className="mt-4 space-y-3">{todoItems.map((item) => <Link key={item.title} to={item.to} className="flex items-center gap-3 rounded-2xl border border-[#f0ece8] p-3 transition hover:border-[#ef7651]/40"><span className={item.done ? "grid h-7 w-7 place-items-center rounded-lg bg-[#d8f4c0] text-[#4d8834]" : "grid h-7 w-7 place-items-center rounded-lg bg-[#fff0e9] text-[#ef7651]"}>{item.done ? <CircleCheck className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</span><span className="min-w-0"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-0.5 truncate text-xs text-[#9a8f87]">{item.detail}</p></span></Link>)}</div></Card>

          <Card className="border-0 bg-white shadow-sm"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">{copy("portfolio")}</h2><Link to="/portfolios" className="grid h-8 w-8 place-items-center rounded-xl bg-[#f5f2ee] text-[#766c65]"><PlusCircle className="h-4 w-4" /></Link></div><div className="mt-4 grid grid-cols-2 gap-2">{portfolioItems.length ? portfolioItems.map((item) => <Link key={item._id} to="/portfolios" className="group relative aspect-square overflow-hidden rounded-2xl bg-[#eeeae5]"><img src={item.image_url || item.thumbnail_url || item.project_url} alt={item.title || copy("portfolioItem")} className="h-full w-full object-cover transition group-hover:scale-105" onError={(event) => { event.currentTarget.style.display = "none"; }} /><div className="absolute inset-0 grid place-items-center text-[#b0a59e]"><ImageIcon className="h-6 w-6" /></div></Link>) : <Link to="/portfolios" className="col-span-2 grid min-h-32 place-items-center rounded-2xl border border-dashed border-[#ded7d0] text-center text-xs text-[#9a8f87]"><span><PlusCircle className="mx-auto mb-2 h-5 w-5" />{copy("addFirstWork")}</span></Link>}</div></Card>
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
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
  const { data: portfolioRes, isLoading: portfolioLoading } = useQuery({
    queryKey: ["dashboard-portfolio"],
    queryFn: () => getMyPortfolio(token),
    enabled: !!token && isStudent,
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
  const firstName = user?.name?.split(" ")[0] ?? t("dashboard.there");

  const userMetrics = userMetricsRes?.data ?? {};
  const proposals = myProposalsRes?.data ?? [];
  const incomingProposals = incomingProposalsRes?.data ?? [];
  const contracts = contractsRes?.data ?? [];
  const wallet = walletRes?.data ?? {};
  const portfolio = portfolioRes?.data ?? [];
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
  if (isStudent) {
    return <StudentDashboard user={user} firstName={firstName} proposals={proposals} contracts={contracts} wallet={wallet} userMetrics={userMetrics} portfolio={portfolio} loading={liveLoading || portfolioLoading} />;
  }
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
        ? config.stats.map((stat, i) => ({
            ...stat,
            value: liveLoading
              ? "…"
              : i === 2 && isAdmin
                ? formatMultiCurrency(
                    adminStats.revenue?.commission_by_currency,
                    liveStats[i],
                    adminStats.revenue?.currency || "USD"
                  )
                : String(liveStats[i]),
          }))
        : config.stats;
  const pendingCount = verificationStatsRes?.data?.pending ?? 0;
  const roleCopy = {
    student: { heading: "dashboard.student.heading", body: "dashboard.student.body", primary: "dashboard.student.primary" },
    client: { heading: "dashboard.client.heading", body: "dashboard.client.body", primary: "dashboard.client.primary" },
    university_staff: { heading: "dashboard.staff.heading", body: "dashboard.staff.body", primary: null },
    admin: { heading: "dashboard.admin.heading", body: "dashboard.admin.body", primary: null },
  }[role];
  const localizedConfig = {
    ...config,
    heading: t(roleCopy.heading),
    body: t(roleCopy.body),
    primary: config.primary ? { ...config.primary, label: t(roleCopy.primary) } : null,
  };
  const localizedStats = stats.map((stat, index) => ({
    ...stat,
    label: t(`dashboard.details.${role}.stat${index}.label`, { defaultValue: stat.label }),
    hint: t(`dashboard.details.${role}.stat${index}.hint`, { defaultValue: stat.hint }),
  }));
  const localizedActions = config.actions.map((action, index) => ({
    ...action,
    label: t(`dashboard.details.${role}.action${index}.label`, { defaultValue: action.label }),
    body: t(`dashboard.details.${role}.action${index}.body`, { defaultValue: action.body }),
  }));

  return (
    <div className="w-full space-y-6">
      {/* ── Welcome Banner ── */}
      <header className="lm-dashboard-header flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-surface p-6 shadow-card sm:p-7">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
            {t(`dashboard.roles.${role}`)} {t("dashboard.workspace")}
          </span>
          <h1 className="mt-2 font-display text-xl font-bold tracking-tight text-content-primary sm:text-2xl">
            {t("dashboard.welcome", { name: firstName })}
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-content-secondary sm:text-sm">
            {localizedConfig.body}
          </p>
        </div>
        {localizedConfig.primary && (
          <Link to={localizedConfig.primary.to}>
            <Button size="md">{localizedConfig.primary.label}</Button>
          </Link>
        )}
      </header>

      {/* ── University Staff Verification Alert ── */}
      {isUniversityStaff && !user?.staffVerified && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-brand/30 bg-brand-soft p-5">
          <div>
            <p className="text-sm font-bold tracking-tight text-brand">{t("dashboard.staffPendingTitle")}</p>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-content-secondary">
              {t("dashboard.staffPendingDescription")}
            </p>
          </div>
          <Link to="/profile">
            <Button size="sm">{t("dashboard.submitVerification")}</Button>
          </Link>
        </div>
      )}

      {/* ── Metrics Grid ── */}
      <section aria-label={t("dashboard.overview")}>
        <StatGrid>
          {localizedStats.map((stat) => (
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

      <section aria-label={t("dashboard.analytics")} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-base font-bold tracking-tight text-content-primary sm:text-lg">{dashboardChart.title}</h2>
          <div className="mt-3 h-56">
            {liveLoading ? (
              <div className="grid h-full place-items-center text-sm text-content-muted">{t("common.loading")}</div>
            ) : dashboardChart.data.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dashboardChart.data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>
                    {dashboardChart.data.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-content-muted">{t("dashboard.noData")}</div>
            )}
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-base font-bold tracking-tight text-content-primary sm:text-lg">{t("dashboard.liveSources")}</h2>
          <div className="mt-4 space-y-3 text-sm text-content-secondary">
            <p>{t("dashboard.metricsDescription")}</p>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span>{t("dashboard.recordsShown")}</span>
              <span className="font-semibold text-content-primary">{activityItems.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("dashboard.lastLoaded")}</span>
              <span className="font-semibold text-brand">{liveLoading ? t("common.loading") : t("dashboard.live")}</span>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Main Activity Grid ── */}
      <section aria-labelledby="activity-heading" className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <h2 id="activity-heading" className="font-display text-base font-bold tracking-tight text-content-primary sm:text-lg mb-4">
              {localizedConfig.heading}
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
                  localizedConfig.primary ? (
                    <Link to={localizedConfig.primary.to}>
                      <Button size="sm">{localizedConfig.primary.label}</Button>
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
              {localizedActions.map((action) => (
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
