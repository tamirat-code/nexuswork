import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, Briefcase } from "lucide-react";
import { getDashboardAnalytics } from "../../services/api/analytics.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { ROLES } from "../../constants/roles.constants.js";

export default function AnalyticsPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const { data, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: () => getDashboardAnalytics(token), enabled: !!token });
  const a = data?.data ?? {};

  const cards = isAdmin
    ? [
        { label: "Active projects", value: a.active_projects ?? 0, icon: Briefcase },
        { label: "Freelancers", value: a.students ?? 0, icon: Users },
        { label: "Platform income", value: a.income ? `$${a.income.toLocaleString()}` : "$0", icon: TrendingUp },
        { label: "Popular skills", value: a.popular_skills?.length ?? 0, icon: BarChart3 },
      ]
    : [
        { label: "Verified students", value: a.verified_students ?? 0, icon: Users },
        { label: "On-time delivery", value: a.on_time_rate ? `${a.on_time_rate}%` : "—", icon: TrendingUp },
        { label: "Active projects", value: a.active_projects ?? 0, icon: Briefcase },
      ];

  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Popular skills</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : (a.popular_skills?.length ? (
              <ul className="space-y-2">
                {a.popular_skills.map((s) => (
                  <li key={s.name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{s.name}</span>
                    <span className="font-mono text-brass">{s.count}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-300">No data yet.</p>)}
          </CardContent>
        </Card>
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
      </div>
    </div>
  );
}
