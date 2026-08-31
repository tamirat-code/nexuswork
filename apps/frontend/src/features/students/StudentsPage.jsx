import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, GraduationCap, MapPin, Search } from "lucide-react";
import { listStudents } from "../../services/api/students.api.js";
import { Card, CardContent } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/shadcn/avatar.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { StatusBadge } from "../../components/ui/shadcn/status-badge.jsx";
import { useTranslation } from "react-i18next";

export default function StudentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const { data, isLoading, error } = useQuery({
    queryKey: ["students", search, department],
    queryFn: () => listStudents(`?search=${encodeURIComponent(search)}&department=${department}`),
  });

  const students = data?.data ?? [];

  return (
    <div className="w-full animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">{t("students.marketplace")}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">{t("students.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          {t("students.description")}
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("students.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="h-11 rounded-control border border-ink-300 bg-ink-100 px-3 text-sm text-slate outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">{t("students.departments.all")}</option>
          <option value="cs">{t("students.departments.cs")}</option>
          <option value="software">{t("students.departments.software")}</option>
          <option value="it">{t("students.departments.it")}</option>
          <option value="is">{t("students.departments.is")}</option>
        </select>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && [...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-card" />)}

        {error && (
          <Card className="col-span-full p-8 text-center">
            <p className="text-sm text-brick">{error.message}</p>
          </Card>
        )}

        {!isLoading && !error && students.length === 0 && (
          <Card className="col-span-full p-12 text-center">
            <p className="font-display text-lg text-slate">{t("students.noResults")}</p>
            <p className="mt-2 text-sm text-slate-300">{t("students.noResultsHint")}</p>
          </Card>
        )}

        {students.map((s) => (
          <Card key={s._id} className="group transition-shadow hover:shadow-elevated animate-fade-up">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-control">
                    <AvatarImage src={s.avatar} alt="" />
                    <AvatarFallback>{(s.name || "S").slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate">{s.name}</p>
                    <p className="truncate text-xs text-slate-300">{s.department}</p>
                  </div>
                </div>
                {s.verification_status === "verified" ? (
                  <Badge variant="success"><BadgeCheck className="h-3 w-3" /> {t("students.verified")}</Badge>
                ) : (
                  <StatusBadge kind="verification" status={s.verification_status || "unverified"} showDot={false} />
                )}
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                <p className="flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5 text-brass" /> {s.university || t("students.universityStudent")}</p>
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-brass" /> {s.location || t("students.remote")}</p>
              </div>

              {s.skills?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.skills.slice(0, 4).map((sk) => (
                    <Badge key={sk.name || sk} variant="secondary">
                      {sk.name || sk}
                      {sk.level && <span className="text-slate-300">· {sk.level}</span>}
                    </Badge>
                  ))}
                </div>
              )}

              <Link to={`/profile/${s._id}`} className="mt-5 block">
                <Button variant="secondary" size="sm" fullWidth>{t("students.viewProfile")}</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
