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
      className={`block w-full rounded-control px-3 py-2 text-left text-sm transition-colors ${
        active ? "bg-brass/10 font-semibold text-brass" : "text-slate-300 hover:bg-ink-50 hover:text-slate"
      }`}
    >
      {children}
    </button>
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
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl text-slate">Open projects</h1>
          <p className="mt-1 text-sm text-slate-300">
            {isLoading
              ? "Loading…"
              : `${projects.length} brief${projects.length === 1 ? "" : "s"} matching your filters`}
          </p>
        </div>
        {user?.role === "client" && (
          <Link to="/projects/new">
            <Button>Post a project</Button>
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-8">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-300">Category</p>
            <div className="space-y-1">
              <FilterButton active={category === "All"} onClick={() => updateParam("category", "All")}>
                All
              </FilterButton>
              {CATEGORIES.map((cat) => (
                <FilterButton key={cat} active={category === cat} onClick={() => updateParam("category", cat)}>
                  {cat}
                </FilterButton>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-300">Experience</p>
            <div className="space-y-1">
              {EXPERIENCE_LEVELS.map((lvl) => (
                <FilterButton
                  key={lvl.value}
                  active={experience_level === lvl.value}
                  onClick={() => updateParam("experience_level", lvl.value)}
                >
                  {lvl.label}
                </FilterButton>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-300">Sort by</p>
            <div className="space-y-1">
              {SORT_OPTIONS.map((opt) => (
                <FilterButton
                  key={opt.value}
                  active={sort === opt.value}
                  onClick={() => updateParam("sort", opt.value)}
                >
                  {opt.label}
                </FilterButton>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, skill or keyword"
            className="mb-6 h-12 w-full rounded-control border border-ink-300 bg-ink-50 px-4 text-sm text-slate placeholder:text-slate-300 focus:border-brass/50 focus:outline-none"
          />

          {isLoading && (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          )}

          {error && <p className="text-sm text-brick">{error.message}</p>}

          {!isLoading && !error && projects.length === 0 && (
            <p className="text-sm text-slate-300">No projects match your filters yet.</p>
          )}

          <div className="space-y-4">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}