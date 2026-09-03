import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BarChart3, TrendingUp, Users, Briefcase } from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getPlatformAnalytics, getMyUniversityAnalytics } from "../../services/api/analytics.api.js";
import { listAdminStats } from "../../services/api/admin.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { chartColors, chartTooltipStyle } from "../../lib/chartStyles.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { ROLES } from "../../constants/roles.constants.js";

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

  const { data, isLoading: analyticsLoading } = useQuery({
    queryKey: isAdmin ? ["analytics", "platform"] : ["analytics", "university", "mine"],
    queryFn: () => (isAdmin ? getPlatformAnalytics(token) : getMyUniversityAnalytics(token)),
    enabled: !!token,
  });
  const { data: adminDashboardRes, isLoading: adminDashboardLoading } = useQuery({
    queryKey: ["analytics-admin-dashboard"],
    queryFn: () => listAdminStats(token),
    enabled: !!token && isAdmin,
  });
  const isLoading = analyticsLoading || (isAdmin && adminDashboardLoading);
  const a = data?.data ?? {};
  const adminDashboard = adminDashboardRes?.data ?? {};
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
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">{t("analytics.eyebrow")}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">{t("analytics.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          {isAdmin ? t("analytics.subtitlePlatform") : t("analytics.subtitleUniversity")}
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <c.icon className="h-5 w-5 text-brass" />
              <p className="mt-3 font-mono text-2xl font-semibold text-slate">{isLoading ? "…" : c.value}</p>
              <p className="text-xs text-slate-300">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isAdmin && a.privacy_suppressed && (
        <Card className="mt-6 border-brass/40">
          <CardContent className="p-5 text-sm text-slate-300">
            <p className="font-semibold text-slate">{t("analytics.privacyTitle")}</p>
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
                      <span className="text-slate-300">{s.name}</span>
                      <span className="font-mono text-brass">{s.count}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-300">{t("analytics.noData")}</p>;
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
                      <span className="text-slate-300">{c.category}</span>
                      <span className="font-mono text-brass">{c.projects}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-300">{t("analytics.noData")}</p>)}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-lg">{t("analytics.outcomes")}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{t("analytics.employmentRate")}</span>
                <span className="font-mono text-brass">
                  {universitySuppressed ? "—" : a.employment_rate != null ? `${Math.round(a.employment_rate * 100)}%` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{t("analytics.aggregateEarnings")}</span>
                <span className="font-mono text-brass">{universitySuppressed ? "—" : formatCurrency(a.aggregate_earnings ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{t("analytics.releasedMilestones")}</span>
                <span className="font-mono text-brass">{universitySuppressed ? "—" : a.released_milestone_count ?? 0}</span>
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
    </div>
  );
}
