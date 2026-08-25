import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Briefcase, GraduationCap, Search, Users } from "lucide-react";
import { searchAll } from "../../services/api/search.api.js";
import ProjectCard from "../../components/cards/ProjectCard.jsx";
import Spinner from "../../components/loaders/Spinner.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { StatusBadge } from "../../components/ui/shadcn/status-badge.jsx";

const SUGGESTIONS = ["React", "Figma", "Data analysis", "Copywriting", "Video editing", "SEO"];

const TABS = [
  { value: "projects", label: "Projects", icon: Briefcase },
  { value: "students", label: "Talent", icon: Users },
  { value: "universities", label: "Universities", icon: GraduationCap },
];

function StudentResultCard({ result }) {
  const userId = result.user_id?._id;
  return (
    <Link
      to={userId ? `/profile/${userId}` : "#"}
      className="flex flex-col gap-3 rounded-card border border-ink-300 bg-ink-50 p-5 shadow-card transition-colors hover:border-brass/40 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-slate">{result.user_id?.name || "Student"}</p>
          {result.verification_status === "verified" && (
            <Badge variant="success"><BadgeCheck className="h-3 w-3" /> Verified</Badge>
          )}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
          <GraduationCap className="h-3.5 w-3.5 text-brass" />
          {result.university_id?.name || "University student"}
          {result.program ? ` · ${result.program}` : ""}
        </p>
        {result.bio && <p className="mt-2 line-clamp-2 text-sm text-slate-300">{result.bio}</p>}
      </div>
      {result.skills?.length > 0 && (
        <div className="flex shrink-0 flex-wrap gap-1.5 sm:max-w-[220px] sm:justify-end">
          {result.skills.slice(0, 4).map((sk, i) => (
            <Badge key={sk.name || i} variant="secondary">{sk.name}</Badge>
          ))}
        </div>
      )}
    </Link>
  );
}

function UniversityResultCard({ result }) {
  return (
    <div className="flex items-center justify-between rounded-card border border-ink-300 bg-ink-50 p-5 shadow-card">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-5 w-5 text-brass" />
        <div>
          <p className="font-semibold text-slate">{result.name}</p>
          <p className="font-mono text-xs text-slate-300">{result.domain}</p>
        </div>
      </div>
      <p className="text-xs text-slate-300">
        {result.contact_staff?.length || 0} staff contact{result.contact_staff?.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "projects";
  const [input, setInput] = useState(query);

  useEffect(() => {
    setInput(query);
  }, [query]);

  function submit(event) {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (input.trim()) next.set("q", input.trim());
    else next.delete("q");
    setSearchParams(next, { replace: true });
  }

  function setType(nextType) {
    const next = new URLSearchParams(searchParams);
    next.set("type", nextType);
    setSearchParams(next, { replace: true });
  }

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    p.set("type", type);
    return `?${p.toString()}`;
  }, [query, type]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["search", queryString],
    queryFn: () => searchAll(queryString),
    enabled: Boolean(query),
  });

  const results = data?.data?.results ?? [];
  const total = data?.data?.total ?? results.length;

  return (
    <div className="w-full">
      <header className="border-b border-ink-300 pb-6">
        <h1 className="font-display text-2xl leading-tight tracking-tight text-slate sm:text-3xl">Search</h1>
        <p className="mt-1.5 text-sm text-slate-300">
          Find open briefs, verified student talent, or partner universities.
        </p>
      </header>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="site-search" className="sr-only">
          Search
        </label>
        <input
          id="site-search"
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            type === "students"
              ? "e.g. Abebe, Hanna…"
              : type === "universities"
                ? "e.g. Addis Ababa University, aau.edu.et"
                : "e.g. React dashboard, brand identity, survey analysis"
          }
          className="h-11 flex-1 rounded-control border border-ink-300 bg-ink-50 px-4 text-sm text-slate transition-colors placeholder:text-slate-300 focus:border-brass/50 focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-control bg-brass px-6 text-sm font-semibold tracking-tight text-ink transition-colors hover:bg-brass-300"
        >
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              type === t.value
                ? "border-brass bg-brass/10 text-brass"
                : "border-ink-300 bg-ink-50 text-slate-300 hover:border-brass/40 hover:text-brass"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {type === "projects" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-300">Try:</span>
          {SUGGESTIONS.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.set("q", term);
                next.set("type", "projects");
                setSearchParams(next, { replace: true });
              }}
              className="rounded-full border border-ink-300 bg-ink-50 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-brass/40 hover:text-brass"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        {!query && (
          <p className="rounded-card border border-ink-300 bg-ink-50 px-6 py-12 text-center text-sm text-slate-300">
            Enter a keyword above to search {type === "projects" ? "open projects" : type === "students" ? "student talent" : "universities"}, or{" "}
            <Link to="/projects" className="font-semibold text-brass hover:text-brass-300">
              browse everything
            </Link>
            .
          </p>
        )}

        {query && isLoading && (
          <div className="flex justify-center py-14">
            <Spinner />
          </div>
        )}

        {query && error && (
          <p className="rounded-card border border-brick/30 bg-brick-100 px-4 py-3 text-sm text-brick">
            {error.message}
          </p>
        )}

        {query && !isLoading && !error && (
          <>
            <p className="mb-4 text-sm text-slate-300">
              {total} result{total === 1 ? "" : "s"} for "{query}"
            </p>
            {results.length === 0 ? (
              <div className="rounded-card border border-ink-300 bg-ink-50 px-6 py-12 text-center">
                <p className="font-display text-base tracking-tight text-slate">Nothing matched that search</p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-300">
                  Try a shorter keyword, a different tab, or browse everything directly.
                </p>
                <Link
                  to={type === "students" ? "/students" : "/projects"}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-control border border-ink-300 px-6 text-sm font-semibold text-slate transition-colors hover:border-brass/40 hover:bg-ink-50"
                >
                  Browse all {type === "students" ? "talent" : "projects"}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {type === "projects" && results.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
                {type === "students" && results.map((r) => (
                  <StudentResultCard key={r._id} result={r} />
                ))}
                {type === "universities" && results.map((r) => (
                  <UniversityResultCard key={r._id} result={r} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}