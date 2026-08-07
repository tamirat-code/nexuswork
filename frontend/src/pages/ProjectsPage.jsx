import { useState, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import ProjectCard from "../components/marketplace/ProjectCard";
import FilterPanel from "../components/marketplace/FilterPanel";
import { MOCK_PROJECTS, CATEGORIES } from "../data/projects";

export default function ProjectsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Projects");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedProjects, setSavedProjects] = useState([]);
  const [filters, setFilters] = useState({
    budgetType: "all",
    minBudget: "",
    maxBudget: "",
    experience: [],
    duration: [],
    remote: false,
    featured: false,
    urgent: false,
    minMatch: 0,
    skills: [],
  });

  const filteredProjects = useMemo(() => {
    return MOCK_PROJECTS.filter((p) => {
      // Search
      const matchesQuery = !query || 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        p.skills.some(s => s.toLowerCase().includes(query.toLowerCase()));

      // Category
      const matchesCategory = category === "All Projects" || p.category === category;

      // Budget Type
      const matchesBudgetType = filters.budgetType === "all" || p.budgetType === filters.budgetType;

      // Budget Range
      const matchesBudget = 
        (!filters.minBudget || p.budget >= parseInt(filters.minBudget)) &&
        (!filters.maxBudget || p.budget <= parseInt(filters.maxBudget));

      // Experience
      const matchesExperience = 
        filters.experience.length === 0 || filters.experience.includes(p.experienceLevel);

      // AI Match
      const matchesMatch = p.matchScore >= (filters.minMatch || 0);

      // Quick Filters
      const matchesRemote = !filters.remote || p.remote;
      const matchesFeatured = !filters.featured || p.featured;
      const matchesUrgent = !filters.urgent || p.urgent;

      // Skills
      const matchesSkills = 
        filters.skills.length === 0 || filters.skills.some(s => p.skills.includes(s));

      return matchesQuery && matchesCategory && matchesBudgetType && matchesBudget &&
             matchesExperience && matchesMatch && matchesRemote && matchesFeatured &&
             matchesUrgent && matchesSkills;
    });
  }, [query, category, filters]);

  const handleSave = (projectId, isSaved) => {
    if (isSaved) {
      setSavedProjects([...savedProjects, projectId]);
    } else {
      setSavedProjects(savedProjects.filter(id => id !== projectId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Project Marketplace</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">Discover verified projects matched to your skills.</p>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, skills, or clients..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:bg-slate-900"
            />
          </div>
          
          <button 
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[256px_1fr]">
        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFilterChange={setFilters}
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
        />

        {/* Main Content */}
        <div>
          {/* Categories & Results Count */}
          <div className="mb-6 space-y-4">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    category === cat
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Results Count & Sort */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                {filteredProjects.length} projects found
              </p>
              <select className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
                <option>Sort by: Most Recent</option>
                <option>Sort by: AI Match</option>
                <option>Sort by: Budget (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Projects Grid */}
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project}
                  onSave={handleSave}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-12 dark:border-white/10">
              <p className="text-lg font-semibold text-slate-700 dark:text-zinc-200">No projects match your filters</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}