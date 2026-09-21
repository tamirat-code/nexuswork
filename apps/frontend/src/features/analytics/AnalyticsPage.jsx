import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BarChart3, TrendingUp, Users, Briefcase, Wallet, FileText } from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getPlatformAnalytics, getMyUniversityAnalytics, getMyAnalytics, getDeliveryAnalytics } from "../../services/api/analytics.api.js";
import { getMyWallet } from "../../services/api/wallets.api.js";
import { listMyProposals } from "../../services/api/proposals.api.js";
import { listMyContracts } from "../../services/api/contracts.api.js";
import { listAdminStats } from "../../services/api/admin.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { chartColors, chartTooltipStyle } from "../../lib/chartStyles.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { ROLES } from "../../constants/roles.constants.js";

function PersonalAnalytics({ t, analytics, wallet, proposals, contracts, loading }) {
  const proposalData = ["pending", "accepted", "rejected", "withdrawn"]
    .map((status) => ({ name: status, value: proposals.filter((proposal) => proposal.status === status).length }))
    .filter((item) => item.value > 0);
  const contractData = ["active", "completed", "cancelled"]
    .map((status) => ({ name: status, value: contracts.filter((contract) => contract.status === status).length }))
    .filter((item) => item.value > 0);
  const walletBalances = Object.fromEntries(
    Object.entries(wallet?.balances || {}).map(([currency, balance]) => [currency, balance?.available ?? 0])
  );
  const cards = [
    { label: t("analyticsPersonal.earnings"), value: formatMultiCurrency(walletBalances, analytics?.earnings ?? 0, wallet?.currency || analytics?.currency || "USD"), icon: TrendingUp },
    { label: t("analyticsPersonal.payments"), value: analytics?.payments_count ?? 0, icon: Wallet },
    { label: t("analyticsPersonal.proposals"), value: proposals.length, icon: FileText },
    { label: t("analyticsPersonal.activeContracts"), value: contracts.filter((contract) => ["active", "pending_signature", "pending_review"].includes(contract.status)).length, icon: Briefcase },
  ];
  const chart = (data, title) => (
    <Card>
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-56 w-full" /> : data.length ? (
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>{data.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip contentStyle={chartTooltipStyle} /><Legend /></PieChart></ResponsiveContainer></div>
        ) : <p className="py-16 text-center text-sm text-content-secondary">{t("analyticsPersonal.noData")}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full animate-fade-up">
      <header className="border-b border-border-subtle pb-6"><p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{t("analyticsPersonal.eyebrow")}</p><h1 className="mt-2 font-display text-3xl tracking-tight text-content-primary">{t("analyticsPersonal.title")}</h1><p className="mt-2 max-w-2xl text-sm text-content-secondary">{t("analyticsPersonal.subtitle")}</p></header>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map((card) => <Card key={card.label} className="border-border-subtle bg-surface-soft"><CardContent className="p-5"><card.icon className="h-5 w-5 text-brand" /><p className="mt-3 font-mono text-2xl font-semibold text-content-primary">{loading ? "…" : card.value}</p><p className="text-xs text-content-secondary">{card.label}</p></CardContent></Card>)}</div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">{chart(proposalData, t("analyticsPersonal.proposalPipeline"))}{chart(contractData, t("analyticsPersonal.contractStatus"))}</div>
      <Card className="mt-6"><CardHeader><CardTitle className="text-lg">{t("analyticsPersonal.activity")}</CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-32 w-full" /> : <div className="space-y-3">{[...proposals.slice(0, 4).map((item) => ({ title: item.project_id?.title || t("analyticsPersonal.project"), detail: `${t("analyticsPersonal.proposal")} · ${item.status || "pending"}` })), ...contracts.slice(0, 4).map((item) => ({ title: item.project_id?.title || item.terms?.title || t("analyticsPersonal.contract"), detail: `${t("analyticsPersonal.contract")} · ${item.status || "active"}` }))].slice(0, 6).map((item, index) => <div key={`${item.title}-${index}`} className="flex items-center justify-between rounded-xl border border-border-subtle px-4 py-3 text-sm"><span className="truncate font-medium text-content-primary">{item.title}</span><span className="ml-4 shrink-0 text-xs capitalize text-content-muted">{item.detail}</span></div>) || <p className="text-sm text-content-secondary">{t("analyticsPersonal.noActivity")}</p>}</div>}</CardContent></Card>
    </div>
  );
}

function formatMultiCurrency(values, fallback, fallbackCurrency = "USD") {
  const entries = Object.entries(values || {}).filter(([, amount]) => amount != null);
  if (!entries.length) return formatCurrency(fallback ?? 0, fallbackCurrency);
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amount]) => formatCurrency(amount, currency.toUpperCase()))
    .join(" · ");
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const isStudent = user?.role === ROLES.STUDENT;

  const { data, isLoading: analyticsLoading } = useQuery({
    queryKey: isAdmin ? ["analytics", "platform"] : ["analytics", "university", "mine"],
    queryFn: () => (isAdmin ? getPlatformAnalytics(token) : getMyUniversityAnalytics(token)),
    enabled: !!token && !isStudent,
  });
  const { data: personalRes, isLoading: personalLoading } = useQuery({
    queryKey: ["analytics", "personal"],
    queryFn: () => getMyAnalytics(token),
    enabled: !!token && isStudent,
  });
  const { data: personalWalletRes, isLoading: personalWalletLoading } = useQuery({
    queryKey: ["analytics", "personal", "wallet"],
    queryFn: () => getMyWallet(token),
    enabled: !!token && isStudent,
  });
  const { data: proposalsRes, isLoading: proposalsLoading } = useQuery({
    queryKey: ["analytics", "personal", "proposals"],
    queryFn: () => listMyProposals(token),
    enabled: !!token && isStudent,
  });
  const { data: contractsRes, isLoading: contractsLoading } = useQuery({
    queryKey: ["analytics", "personal", "contracts"],
    queryFn: () => listMyContracts(token),
    enabled: !!token && isStudent,
  });
  const { data: adminDashboardRes, isLoading: adminDashboardLoading } = useQuery({
    queryKey: ["analytics-admin-dashboard"],
    queryFn: () => listAdminStats(token),
    enabled: !!token && isAdmin,
  });
  const { data: deliveryRes, isLoading: deliveryLoading } = useQuery({
    queryKey: ["analytics", "delivery"],
    queryFn: () => getDeliveryAnalytics({}, token),
    enabled: !!token && isAdmin,
  });
  const isLoading = analyticsLoading || (isAdmin && adminDashboardLoading);
  const a = data?.data ?? {};
  const adminDashboard = adminDashboardRes?.data ?? {};
  const deliveryRows = deliveryRes?.data ?? [];
  if (isStudent) {
    return <PersonalAnalytics t={t} analytics={personalRes?.data ?? {}} wallet={personalWalletRes?.data ?? {}} proposals={proposalsRes?.data ?? []} contracts={contractsRes?.data ?? []} loading={personalLoading || personalWalletLoading || proposalsLoading || contractsLoading} />;
  }
  const universitySuppressed = !isAdmin && a.privacy_suppressed;
  const adminRoleData = (adminDashboard.users?.by_role || [])
    .map((item) => ({ name: String(item._id || "unknown").replaceAll("_", " "), value: item.count }))
    .filter((item) => item.value > 0);
  const universityOutcomeData = universitySuppressed
    ? []
    : [
        { name: "Employed", value: a.employed_student_count ?? 0 },
        { name: "Not yet employed", value: Math.max((a.verified_students ?? 0) - (a.employed_student_count ?? 0), 0) },
      ].filter((item) => item.value > 0);
  const secondaryChartData = universitySuppressed
    ? []
    : (isAdmin ? (a.demand_by_category || []) : (a.top_skills || []))
        .map((item) => ({
          name: isAdmin ? item.category : item.name,
          value: isAdmin ? item.projects : item.count,
        }))
        .filter((item) => item.name && item.value > 0);

  const cards = isAdmin
    ? [
        { label: t("analytics.activeProjects"), value: a.active_projects ?? 0, icon: Briefcase },
        { label: t("analytics.freelancers"), value: a.students ?? 0, icon: Users },
        {
          label: t("analytics.platformIncome"),
          value: formatMultiCurrency(
            a.income_by_currency,
            a.income ?? 0,
            adminDashboard.revenue?.currency || "USD"
          ),
          icon: TrendingUp,
        },
        { label: t("analytics.popularSkills"), value: a.popular_skills?.length ?? 0, icon: BarChart3 },
      ]
    : [
        { label: t("analytics.verifiedStudents"), value: universitySuppressed ? "—" : a.verified_students ?? 0, icon: Users },
        { label: t("analytics.onTimeDelivery"), value: universitySuppressed ? "—" : a.on_time_rate != null ? `${a.on_time_rate}%` : "—", icon: TrendingUp },
        { label: t("analytics.activeProjects"), value: universitySuppressed ? "—" : a.active_projects ?? 0, icon: Briefcase },
      ];

  return (
    <div className="w-full animate-fade-up">
      <header className="border-b border-border-subtle pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{t("analytics.eyebrow")}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-content-primary">{t("analytics.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-content-secondary">
          {isAdmin ? t("analytics.subtitlePlatform") : t("analytics.subtitleUniversity")}
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-border-subtle bg-surface-soft">
            <CardContent className="p-5">
              <c.icon className="h-5 w-5 text-brand" />
              <p className="mt-3 font-mono text-2xl font-semibold text-content-primary">{isLoading ? "…" : c.value}</p>
              <p className="text-xs text-content-secondary">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isAdmin && a.privacy_suppressed && (
        <Card className="mt-6 border-brand/30 bg-brand-soft">
          <CardContent className="p-5 text-sm text-content-secondary">
            <p className="font-semibold text-content-primary">{t("analytics.privacyTitle")}</p>
            <p className="mt-1">{a.message || `University outcomes require at least ${a.minimum_cohort_size || 5} verified students.`}</p>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">{isAdmin ? t("analytics.topSkillsTitle") : t("analytics.topSkillsUniTitle")}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : (() => {
              const skills = isAdmin ? a.popular_skills : a.top_skills;
              return skills?.length ? (
                <ul className="space-y-2">
                  {skills.map((s) => (
                    <li key={s.name} className="flex items-center justify-between text-sm">
                      <span className="text-content-secondary">{s.name}</span>
                      <span className="font-mono text-brand">{s.count}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-content-secondary">{t("analytics.noData")}</p>;
            })()}
          </CardContent>
        </Card>
        {isAdmin ? (
          <Card>
            <CardHeader><CardTitle className="text-lg">{t("analytics.marketDemand")}</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-40 w-full" /> : (a.demand_by_category?.length ? (
                <ul className="space-y-2">
                  {a.demand_by_category.map((c) => (
                    <li key={c.category} className="flex items-center justify-between text-sm">
                      <span className="text-content-secondary">{c.category}</span>
                      <span className="font-mono text-brand">{c.projects}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-content-secondary">{t("analytics.noData")}</p>)}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-lg">{t("analytics.outcomes")}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-content-secondary">{t("analytics.employmentRate")}</span>
                <span className="font-mono text-brand">
                  {universitySuppressed ? "—" : a.employment_rate != null ? `${Math.round(a.employment_rate * 100)}%` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-content-secondary">{t("analytics.aggregateEarnings")}</span>
                <span className="font-mono text-brand">{universitySuppressed ? "—" : formatCurrency(a.aggregate_earnings ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-content-secondary">{t("analytics.releasedMilestones")}</span>
                <span className="font-mono text-brand">{universitySuppressed ? "—" : a.released_milestone_count ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">{isAdmin ? t("analytics.userMix") : t("analytics.employmentMix")}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-56 w-full" /> : (isAdmin ? adminRoleData : universityOutcomeData).length ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={isAdmin ? adminRoleData : universityOutcomeData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>
                      {(isAdmin ? adminRoleData : universityOutcomeData).map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="py-16 text-center text-sm text-slate-300">{t("analytics.noData")}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{isAdmin ? t("analytics.disputeStatus") : t("analytics.deliveryOutcomes")}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-56 w-full" /> : (() => {
              const dataSet = isAdmin
                ? [
                    { name: "Open", value: adminDashboard.disputes?.open ?? 0 },
                    { name: "Resolved (30d)", value: adminDashboard.disputes?.resolved_30d ?? 0 },
                  ].filter((item) => item.value > 0)
                : [
                    { name: "On time", value: a.on_time_rate != null ? a.on_time_rate : 0 },
                    { name: "Late / unavailable", value: a.on_time_rate != null ? Math.max(100 - a.on_time_rate, 0) : 0 },
                  ].filter((item) => item.value > 0);
              return dataSet.length ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dataSet} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>
                        {dataSet.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="py-16 text-center text-sm text-slate-300">{t("analytics.noData")}</p>;
            })()}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-lg">{isAdmin ? t("analytics.demandByCategory") : t("analytics.skillsRepresented")}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-56 w-full" /> : secondaryChartData.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={secondaryChartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>
                    {secondaryChartData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="py-16 text-center text-sm text-slate-300">{t("analytics.noData")}</p>}
        </CardContent>
      </Card>
      {isAdmin && <Card className="mt-6">
        <CardHeader><CardTitle>{t("analytics.deliveryByStudentCategory", { defaultValue: "Delivery by student and category" })}</CardTitle></CardHeader>
        <CardContent>{deliveryLoading ? <Skeleton className="h-24 w-full" /> : deliveryRows.length ? <div className="space-y-2">{deliveryRows.slice(0, 12).map((row) => <div key={`${row.student_id}-${row.category}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2 text-sm"><span className="font-medium text-content-primary">{row.student?.name || row.student?.email || "Student"} · {row.category}</span><span className="text-content-secondary">{row.on_time_rate}% on time · {row.delivered} delivered</span></div>)}</div> : <p className="text-sm text-content-secondary">{t("analytics.noData")}</p>}</CardContent>
      </Card>}
    </div>
  );
}
