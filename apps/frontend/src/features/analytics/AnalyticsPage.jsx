import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, Briefcase } from "lucide-react";
import { getPlatformAnalytics, getUniversityAnalytics } from "../../services/api/analytics.api.js";
import { getMyUniversity } from "../../services/api/universities.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { ROLES } from "../../constants/roles.constants.js";

export default function AnalyticsPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const { data: universityData, isLoading: universityLoading } = useQuery({
    queryKey: ["my-university"],
    queryFn: () => getMyUniversity(token),
    enabled: !!token && !isAdmin,
  });
  const universityId = universityData?.data?._id;

  const { data, isLoading: analyticsLoading } = useQuery({
    queryKey: isAdmin ? ["analytics", "platform"] : ["analytics", "university", universityId],
    queryFn: () => (isAdmin ? getPlatformAnalytics(token) : getUniversityAnalytics(universityId, token)),
    enabled: !!token && (isAdmin || !!universityId),
  });
  const isLoading = isAdmin ? analyticsLoading : universityLoading || analyticsLoading;
  const a = data?.data ?? {};
  const universitySuppressed = !isAdmin && a.privacy_suppressed;

  const cards = isAdmin
    ? [
        { label: "Active projects", value: a.active_projects ?? 0, icon: Briefcase },
        { label: "Freelancers", value: a.students ?? 0, icon: Users },
        { label: "Platform income", value: formatCurrency(a.income ?? 0), icon: TrendingUp },
        { label: "Popular skills", value: a.popular_skills?.length ?? 0, icon: BarChart3 },
      ]
    : [
        { label: "Verified students", value: universitySuppressed ? "—" : a.verified_students ?? 0, icon: Users },
        { label: "On-time delivery", value: universitySuppressed ? "—" : a.on_time_rate != null ? `${a.on_time_rate}%` : "—", icon: TrendingUp },
        { label: "Active projects", value: universitySuppressed ? "—" : a.active_projects ?? 0, icon: Briefcase },
      ];

  return (
    <div className="w-full animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Insights</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          {isAdmin ? "Full platform metrics — projects, freelancers, income, and demand." : "Aggregate, anonymized outcomes for your institution only."}
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
            <p className="font-semibold text-slate">Privacy threshold applied</p>
            <p className="mt-1">{a.message || `University outcomes require at least ${a.minimum_cohort_size || 5} verified students.`}</p>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">{isAdmin ? "Popular skills" : "Top skills at your institution"}</CardTitle></CardHeader>
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
              ) : <p className="text-sm text-slate-300">No data yet.</p>;
            })()}
          </CardContent>
        </Card>
        {isAdmin ? (
          <Card>
            <CardHeader><CardTitle className="text-lg">Market demand</CardTitle></CardHeader>
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
              ) : <p className="text-sm text-slate-300">No data yet.</p>)}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-lg">Outcomes</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Employment rate</span>
                <span className="font-mono text-brass">
                  {universitySuppressed ? "—" : a.employment_rate != null ? `${Math.round(a.employment_rate * 100)}%` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Aggregate earnings</span>
                <span className="font-mono text-brass">{universitySuppressed ? "—" : formatCurrency(a.aggregate_earnings ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Released milestones</span>
                <span className="font-mono text-brass">{universitySuppressed ? "—" : a.released_milestone_count ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
