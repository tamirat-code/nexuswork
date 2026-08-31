import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { getLearningRecommendations } from "../../services/api/learning.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";

export default function LearningPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["learning"], queryFn: () => getLearningRecommendations(token), enabled: !!token });
  const courses = data?.data ?? [];

  return (
    <div className="w-full animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">{t("learning.eyebrow")}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">{t("learning.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          {t("learning.subtitle")}
        </p>
      </header>

      {isLoading && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>}

      {!isLoading && courses.length === 0 && (
        <Card className="mt-8 p-14 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-brass" />
          <h3 className="mt-4 font-display text-lg text-slate">{t("learning.emptyTitle")}</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-300">{t("learning.emptyDesc")}</p>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <Card key={c._id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-brass" />
                <Badge variant="secondary">{c.category || t("learning.generalCategory")}</Badge>
              </div>
              <CardTitle className="text-base">{c.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="flex-1 text-sm text-slate-300">{c.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs capitalize text-slate-300"><GraduationCap className="h-3.5 w-3.5" /> {c.resource_type || t("learning.resourceType")}</span>
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="secondary">{t("learning.startCourse")}</Button>
                  </a>
                ) : (
                  <Button size="sm" variant="secondary" disabled>{t("learning.startCourse")}</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}