import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "../../services/api/projects.api.js";
import ProjectCard from "../../components/cards/ProjectCard.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import Button from "../../components/ui/Button.jsx";
import { useTranslation } from "react-i18next";

const CATEGORIES = [
  { slug: "web-development", name: "Web Development" },
  { slug: "mobile-development", name: "Mobile Development" },
  { slug: "data-science-ml", name: "Data Science & ML" },
  { slug: "ui-ux-design", name: "UI/UX Design" },
  { slug: "graphic-design", name: "Graphic Design" },
  { slug: "writing-content", name: "Writing & Content" },
  { slug: "marketing-seo", name: "Marketing & SEO" },
  { slug: "research-analysis", name: "Research & Analysis" },
  { slug: "engineering-cad", name: "Engineering & CAD" },
  { slug: "video-animation", name: "Video & Animation" },
  { slug: "translation-languages", name: "Translation & Languages" },
  { slug: "other", name: "Other" },
];

const EXPERIENCE_LEVELS = [
  { value: "any", label: "Any level" },
  { value: "entry", label: "Entry" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "budget", label: "Highest budget" },
  { value: "proposals", label: "Fewest proposals" },
];

const selectClasses =
  "h-10 shrink-0 rounded-control border border-ink-300 bg-ink-50 px-3 text-sm text-slate transition-colors focus:border-brass/50 focus:outline-none";

function CardSkeleton() {
  return (
    <div className="rounded-card border border-ink-300 bg-ink-50 p-5">
      <div className="h-3 w-32 rounded bg-ink-300" />
      <div className="mt-3 h-4 w-2/3 rounded bg-ink-300" />
      <div className="mt-3 h-3 w-full rounded bg-ink-300" />
      <div className="mt-2 h-3 w-4/5 rounded bg-ink-300" />
    </div>
  );
}

export default function ProjectListPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") || "All";
  const experience_level = searchParams.get("experience_level") || "any";
  const sort = searchParams.get("sort") || "newest";
  const search = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(search);

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== search) updateParam("search", searchInput.trim());
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "All" || value === "any" || value === "newest") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    setSearchInput("");
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  const hasFilters = category !== "All" || experience_level !== "any" || sort !== "newest" || Boolean(search);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    if (experience_level !== "any") params.set("experience_level", experience_level);
    if (sort !== "newest") params.set("sort", sort);
    if (search) params.set("search", search);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [category, experience_level, sort, search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", queryString],
    queryFn: () => listProjects(queryString),
  });

  const projects = data?.data ?? [];

  return (
    <div className="w-full">
      <header className="lm-dashboard-header flex flex-col items-start justify-between gap-4 rounded-2xl border border-ink-300 bg-ink-50 px-7 py-7 shadow-card sm:flex-row sm:items-center">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brass">
            {t("projects.marketplace", { defaultValue: "Marketplace Briefs" })}
          </p>
          <h1 className="mt-1 font-display font-extrabold text-2xl leading-tight tracking-tight text-slate sm:text-3xl">
            {t("projects.title", { defaultValue: "Explore Open Projects" })}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            {isLoading
              ? t("common.loading")
              : t("projects.showing", { count: projects.length, defaultValue: `Showing ${projects.length} brief${projects.length === 1 ? "" : "s"} matching your criteria` })}
          </p>
        </div>
        {user?.role === "client" && (
          <Link to="/projects/new">
            <Button size="md" className="shadow-elevated">
              {t("projects.post", { defaultValue: "Post a project" })}
            </Button>
          </Link>
        )}
      </header>

      <div className="mt-7 flex flex-wrap items-center gap-3 rounded-card border border-ink-300 bg-ink-50 p-4 shadow-card">
        <label htmlFor="project-search" className="sr-only">
          {t("projects.search", { defaultValue: "Search projects" })}
        </label>
        <input
          id="project-search"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("projects.searchPlaceholder", { defaultValue: "Search by title, skill or keyword..." })}
          className="h-10 min-w-[240px] flex-1 rounded-control border border-ink-300 bg-ink-100 px-4 text-sm text-slate transition-colors placeholder:text-slate-400 focus:border-brass/60 focus:bg-ink-50 focus:outline-none"
        />

        <label htmlFor="project-category" className="sr-only">
          {t("projects.category", { defaultValue: "Category" })}
        </label>
        <select
          id="project-category"
          value={category}
          onChange={(e) => updateParam("category", e.target.value)}
          className={selectClasses}
        >
          <option value="All">{t("projects.allCategories", { defaultValue: "All categories" })}</option>
          {CATEGORIES.map((categoryOption) => (
            <option key={categoryOption.slug} value={categoryOption.slug}>
              {categoryOption.name}
            </option>
          ))}
        </select>

        <label htmlFor="project-experience" className="sr-only">
          {t("projects.experience", { defaultValue: "Experience level" })}
        </label>
        <select
          id="project-experience"
          value={experience_level}
          onChange={(e) => updateParam("experience_level", e.target.value)}
          className={selectClasses}
        >
          {EXPERIENCE_LEVELS.map((lvl) => (
            <option key={lvl.value} value={lvl.value}>
              {lvl.label}
            </option>
          ))}
        </select>

        <label htmlFor="project-sort" className="sr-only">
          {t("projects.sortBy", { defaultValue: "Sort by" })}
        </label>
        <select
          id="project-sort"
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className={selectClasses}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="shrink-0 text-sm font-bold text-brass transition-colors hover:text-brass-300"
          >
            {t("projects.clearFilters", { defaultValue: "Clear filters" })}
          </button>
        )}
      </div>

      <div className="mt-8">
        {isLoading && (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {error && (
          <p className="rounded-card border border-brick/30 bg-brick-100 px-4 py-3 text-sm text-brick">
            {error.message}
          </p>
        )}

        {!isLoading && !error && projects.length === 0 && (
          <div className="rounded-card border border-ink-300 bg-ink-50 px-6 py-16 text-center shadow-card">
            <p className="font-display text-lg font-bold tracking-tight text-slate">{t("projects.noMatches", { defaultValue: "No projects match your filters" })}</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-300">
              {t("projects.noMatchesHint", { defaultValue: "Try a broader category or clear the filters to see every open brief." })}
            </p>
            {hasFilters && (
              <Button variant="secondary" className="mt-5" onClick={clearFilters}>
                {t("projects.clearFilters", { defaultValue: "Clear filters" })}
              </Button>
            )}
          </div>
        )}

        {projects.length > 0 && (
          <div className="space-y-4">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* ── Mid-page CTA Banner ── */}
      <section className="mt-14 rounded-3xl border border-ink-300 bg-ink-50 p-8 shadow-elevated sm:p-10">
        <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div className="max-w-xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brass">
              {t("projects.hiring", { defaultValue: "Hiring for a project?" })}
            </span>
            <h2 className="mt-1.5 font-display text-2xl font-extrabold text-slate sm:text-3xl">
              {t("projects.ctaTitle", { defaultValue: "Post a brief & connect with verified student talent" })}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {t("projects.ctaDescription", { defaultValue: "Posting is free. Escrow keeps your funds safe until deliverables are approved." })}
            </p>
          </div>
          <Link to="/projects/new" className="shrink-0">
            <Button size="lg" className="shadow-elevated">
              {t("projects.postNow", { defaultValue: "Post a brief now" })}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
