import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { listSkills } from "../../services/api/skills.api.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";

export default function SkillsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["skills"], queryFn: () => listSkills() });
  const skills = data?.data ?? [];

  const grouped = skills.reduce((acc, s) => {
    const cat = s.category || "General";
    (acc[cat] = acc[cat] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="w-full animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Grow</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Skill taxonomy</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">Structured skills (category + name + level) drive search, matching, and certification.</p>
      </header>

      {isLoading && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>}

      {!isLoading && skills.length === 0 && (
        <Card className="mt-8 p-14 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-brass" />
          <h3 className="mt-4 font-display text-lg text-slate">No skills registered yet</h3>
          <p className="mt-2 text-sm text-slate-300">The taxonomy will populate as students register and projects are tagged.</p>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(grouped).map(([cat, items]) => (
          <Card key={cat}>
            <CardHeader><CardTitle className="text-base">{cat}</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {items.map((s) => (
                <Badge key={s._id} variant="secondary">
                  {s.name}
                  {s.level && <span className="text-slate-300">· {s.level}</span>}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
