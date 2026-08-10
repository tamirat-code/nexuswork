import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "../../services/api/projects.api.js";
import ProjectCard from "../../components/cards/ProjectCard.jsx";
import Spinner from "../../components/loaders/Spinner.jsx";

const SUGGESTIONS = ["React", "Figma", "Data analysis", "Copywriting", "Video editing", "SEO"];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [input, setInput] = useState(query);

  useEffect(() => {
    setInput(query);
  }, [query]);

  function submit(event) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (input.trim()) next.set("q", input.trim());
    setSearchParams(next, { replace: true });
  }

  const queryString = useMemo(() => (query ? `?search=${encodeURIComponent(query)}` : ""), [query]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["search", queryString],
    queryFn: () => listProjects(queryString),
    enabled: Boolean(query),
  });

  const results = data?.data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="border-b border-ink-300 pb-6">
        <h1 className="font-display text-2xl leading-tight tracking-tight text-slate sm:text-3xl">Search</h1>
        <p className="mt-1.5 text-sm text-slate-300">
          Find open briefs by title, skill or keyword across every category.
        </p>
      </header>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="site-search" className="sr-only">
          Search projects
        </label>
        <input
          id="site-search"
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. React dashboard, brand identity, survey analysis"
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
        <span className="text-xs text-slate-300">Try:</span>
        {SUGGESTIONS.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => setSearchParams(new URLSearchParams({ q: term }), { replace: true })}
            className="rounded-full border border-ink-300 bg-ink-50 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-brass/40 hover:text-brass"
          >
            {term}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {!query && (
          <p className="rounded-card border border-ink-300 bg-ink-50 px-6 py-12 text-center text-sm text-slate-300">
            Enter a keyword above to search open projects, or{" "}
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
              {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
            </p>
            {results.length === 0 ? (
              <div className="rounded-card border border-ink-300 bg-ink-50 px-6 py-12 text-center">
                <p className="font-display text-base tracking-tight text-slate">Nothing matched that search</p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-300">
                  Try a shorter keyword, or browse the full list of open briefs.
                </p>
                <Link
                  to="/projects"
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-control border border-ink-300 px-6 text-sm font-semibold text-slate transition-colors hover:border-brass/40 hover:bg-ink-50"
                >
                  Browse all projects
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
