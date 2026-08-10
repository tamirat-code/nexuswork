import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "../../services/api/projects.api.js";
import ProjectCard from "../../components/cards/ProjectCard.jsx";
import Spinner from "../../components/loaders/Spinner.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import Button from "../../components/ui/Button.jsx";

const CATEGORIES = ["Development", "Design", "Data & Research", "Writing", "Video & Motion", "Marketing"];

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

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`block w-full rounded-control px-3 py-1.5 text-left text-sm transition-colors ${
        active ? "bg-brass/10 font-semibold text-brass" : "text-slate-300 hover:bg-ink-50 hover:text-slate"
      }`}
    >
      {children}
    </button>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

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
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-col items-start justify-between gap-4 border-b border-ink-300 pb-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl leading-tight tracking-tight text-slate sm:text-3xl">
            Open projects
          </h1>
          <p className="mt-1.5 text-sm text-slate-300">
            {isLoading
              ? "Loading briefs…"
              : `${projects.length} brief${projects.length === 1 ? "" : "s"} matching your filters`}
          </p>
        </div>
        {user?.role === "client" && (
          <Link to="/projects/new">
            <Button>Post a project</Button>
          </Link>
        )}
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[210px_1fr]">
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <FilterGroup label="Category">
            <FilterButton active={category === "All"} onClick={() => updateParam("category", "All")}>
              All
            </FilterButton>
            {CATEGORIES.map((cat) => (
              <FilterButton key={cat} active={category === cat} onClick={() => updateParam("category", cat)}>
                {cat}
              </FilterButton>
            ))}
          </FilterGroup>

          <FilterGroup label="Experience">
            {EXPERIENCE_LEVELS.map((lvl) => (
              <FilterButton
                key={lvl.value}
                active={experience_level === lvl.value}
                onClick={() => updateParam("experience_level", lvl.value)}
              >
                {lvl.label}
              </FilterButton>
            ))}
          </FilterGroup>

          <FilterGroup label="Sort by">
            {SORT_OPTIONS.map((opt) => (
              <FilterButton
                key={opt.value}
                active={sort === opt.value}
                onClick={() => updateParam("sort", opt.value)}
              >
                {opt.label}
              </FilterButton>
            ))}
          </FilterGroup>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-brass transition-colors hover:text-brass-300"
            >
              Clear all filters
            </button>
          )}
        </aside>

        <div>
          <label htmlFor="project-search" className="sr-only">
            Search projects
          </label>
          <input
            id="project-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, skill or keyword"
            className="mb-5 h-11 w-full rounded-control border border-ink-300 bg-ink-50 px-4 text-sm text-slate transition-colors placeholder:text-slate-300 focus:border-brass/50 focus:outline-none"
          />

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
            <div className="rounded-card border border-ink-300 bg-ink-50 px-6 py-14 text-center">
              <p className="font-display text-base tracking-tight text-slate">No projects match your filters</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-300">
                Try a broader category or clear the filters to see every open brief.
              </p>
              {hasFilters && (
                <Button variant="secondary" className="mt-5" onClick={clearFilters}>
                  Clear filters
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
      </div>
    </div>
  );
}
