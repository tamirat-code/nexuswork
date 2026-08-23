import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Sparkles, Zap, TrendingUp, BookOpen } from "lucide-react";
import { getRecommendations, getCareerRecommendation } from "../../services/api/recommendation.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatTimeLeft } from "../../utils/date.utils.js";
import { Card, CardContent } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";

export default function RecommendationPage() {
  const { token, user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["recommendations"], queryFn: () => getRecommendations(token), enabled: !!token });
  const recs = data?.data ?? [];

  const isStudent = user?.role === "student";
  const { data: careerData, isLoading: careerLoading } = useQuery({
    queryKey: ["career-recommendation"],
    queryFn: () => getCareerRecommendation(token),
    enabled: !!token && isStudent,
  });
  const career = careerData?.data;

  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brass"><Sparkles className="h-3.5 w-3.5" /> AI matching</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Recommended for you</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">Projects matched to your verified skills — we tell you exactly why each one fits.</p>
      </header>

      {isStudent && (
        <section className="mt-8">
          <h2 className="flex items-center gap-1.5 font-display text-lg text-slate"><TrendingUp className="h-4 w-4 text-brass" /> Your career path</h2>
          <p className="mt-1 text-sm text-slate-300">Skills in demand on NexusWork that aren't on your profile yet, with resources to close the gap.</p>

          {careerLoading && <Skeleton className="mt-4 h-28 w-full" />}

          {!careerLoading && career && (
            <Card className="mt-4 border-brass/20">
              <CardContent className="p-5">
                {career.summary && <p className="text-sm text-slate-300">{career.summary}</p>}

                {career.skill_path?.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {career.skill_path.map((skill) => (
                      <div key={skill.name} className="rounded-lg border border-ink-300 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm capitalize text-slate">{skill.name}</span>
                          <Badge variant="outline" className="text-xs">{skill.demand_count} open project{skill.demand_count === 1 ? "" : "s"}</Badge>
                        </div>
                        {skill.resources?.length > 0 ? (
                          <ul className="mt-2 space-y-1">
                            {skill.resources.map((r) => (
                              <li key={r._id}>
                                <a
                                  href={r.url || "/learning"}
                                  target={r.url ? "_blank" : undefined}
                                  rel={r.url ? "noreferrer" : undefined}
                                  className="flex items-center gap-1 text-xs text-brass hover:underline"
                                >
                                  <BookOpen className="h-3 w-3" /> {r.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <Link to="/learning" className="mt-2 block text-xs text-slate-300 hover:text-brass hover:underline">
                            Browse learning resources →
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-300">You already cover every in-demand skill we're tracking — nice work.</p>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      )}

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