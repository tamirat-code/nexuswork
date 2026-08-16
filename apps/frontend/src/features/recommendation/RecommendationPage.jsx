import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Sparkles, Zap } from "lucide-react";
import { getRecommendations } from "../../services/api/recommendation.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatTimeLeft } from "../../utils/date.utils.js";
import { Card, CardContent } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";

export default function RecommendationPage() {
  const { token } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["recommendations"], queryFn: () => getRecommendations(token), enabled: !!token });
  const recs = data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brass"><Sparkles className="h-3.5 w-3.5" /> AI matching</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Recommended for you</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">Projects matched to your verified skills — we tell you exactly why each one fits.</p>
      </header>

      {isLoading && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-44 w-full" /><Skeleton className="h-44 w-full" /><Skeleton className="h-44 w-full" /></div>}

      {!isLoading && recs.length === 0 && (
        <Card className="mt-8 p-14 text-center">
          <Zap className="mx-auto h-10 w-10 text-brass" />
          <h3 className="mt-4 font-display text-lg text-slate">No matches yet</h3>
          <p className="mt-2 text-sm text-slate-300">Add more verified skills to unlock smarter recommendations.</p>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recs.map((r) => {
          const p = r.project || r;
          return (
            <Card key={p._id} className="flex flex-col border-brass/20 transition-shadow hover:shadow-elevated">
              <CardContent className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> {r.match_score ? `${Math.round(r.match_score * 100)}% match` : "Recommended"}</Badge>
                  <span className="font-mono text-sm text-brass">{formatCurrency(p.budget)}</span>
                </div>
                <h3 className="mt-3 font-display text-base leading-snug text-slate">{p.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-300">{p.description}</p>

                {r.matched_skills?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {r.matched_skills.map((s) => (
                      <Badge key={s} variant="success" className="text-xs">✓ {s}</Badge>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-ink-300 pt-3 text-xs text-slate-300">
                  <span>{formatTimeLeft(p.deadline)}</span>
                  <Link to={`/projects/${p._id}`}><Button size="sm" variant="secondary">View project</Button></Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
