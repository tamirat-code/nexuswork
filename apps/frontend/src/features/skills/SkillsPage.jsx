import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { listSkills } from "../../services/api/skills.api.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { useTranslation } from "react-i18next";

export default function SkillsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ["skills"], queryFn: () => listSkills() });
  const skills = data?.data ?? [];

  const grouped = skills.reduce((acc, s) => {
    const cat = s.category || "General";
    (acc[cat] = acc[cat] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="w-full animate-fade-up">
      <header className="border-b border-border-subtle pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{t("skills.grow", { defaultValue: "Grow" })}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-content-primary">{t("skills.title", { defaultValue: "Skill taxonomy" })}</h1>
        <p className="mt-2 max-w-2xl text-sm text-content-secondary">{t("skills.description", { defaultValue: "Structured skills (category + name + level) drive search, matching, and certification." })}</p>
      </header>

      {isLoading && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>}

      {!isLoading && skills.length === 0 && (
        <Card className="mt-8 p-14 text-center border-border-subtle bg-surface-soft">
          <Sparkles className="mx-auto h-10 w-10 text-brand" />
          <h3 className="mt-4 font-display text-lg text-content-primary">{t("skills.noSkills", { defaultValue: "No skills registered yet" })}</h3>
          <p className="mt-2 text-sm text-content-secondary">{t("skills.noSkillsHint", { defaultValue: "The taxonomy will populate as students register and projects are tagged." })}</p>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(grouped).map(([cat, items]) => (
          <Card key={cat} className="border-border-subtle bg-surface-soft">
            <CardHeader><CardTitle className="text-base text-content-primary">{cat}</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {items.map((s) => (
                <Badge key={s._id} variant="secondary">
                  {s.name}
                  {s.level && <span className="text-content-muted">· {s.level}</span>}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
