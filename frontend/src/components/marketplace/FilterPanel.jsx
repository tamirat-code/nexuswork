import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { SKILLS } from "../../data/projects";

export default function FilterPanel({ filters, onFilterChange, isOpen, onClose }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const updateFilter = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAll = () => {
    const cleared = {
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
    };
    setLocalFilters(cleared);
    onFilterChange(cleared);
  };

  const toggleArrayFilter = (key, value) => {
    const current = localFilters[key] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto bg-white p-6 shadow-xl transition-transform lg:sticky lg:top-24 lg:z-0 lg:h-fit lg:w-64 lg:translate-x-0 lg:shadow-none dark:bg-slate-900 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Filters</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Budget Type */}
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900 dark:text-white">Budget Type</label>
            <div className="space-y-2">
              {[
                { value: "all", label: "All" },
                { value: "fixed", label: "Fixed Price" },
                { value: "hourly", label: "Hourly Rate" },
              ].map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="budgetType"
                    checked={localFilters.budgetType === opt.value}
                    onChange={() => updateFilter("budgetType", opt.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm text-slate-600 dark:text-zinc-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900 dark:text-white">Budget Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={localFilters.minBudget}
                onChange={(e) => updateFilter("minBudget", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.04]"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={localFilters.maxBudget}
                onChange={(e) => updateFilter("maxBudget", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.04]"
              />
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900 dark:text-white">Experience</label>
            <div className="space-y-2">
              {["Entry", "Intermediate", "Expert"].map((level) => (
                <label key={level} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localFilters.experience?.includes(level)}
                    onChange={() => toggleArrayFilter("experience", level)}
                    className="h-4 w-4 rounded text-blue-600"
                  />
                  <span className="text-sm text-slate-600 dark:text-zinc-300">{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* AI Match */}
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900 dark:text-white">AI Match Score</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={localFilters.minMatch || 0}
              onChange={(e) => updateFilter("minMatch", parseInt(e.target.value))}
              className="w-full"
            />
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>0%</span>
              <span className="font-semibold text-blue-600">{localFilters.minMatch || 0}%+</span>
              <span>100%</span>
            </div>
          </div>

          {/* Quick Filters */}
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900 dark:text-white">Quick Filters</label>
            <div className="space-y-2">
              {[
                { key: "remote", label: "Remote Only" },
                { key: "featured", label: "Featured" },
                { key: "urgent", label: "Urgent" },
              ].map((opt) => (
                <label key={opt.key} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localFilters[opt.key]}
                    onChange={() => updateFilter(opt.key, !localFilters[opt.key])}
                    className="h-4 w-4 rounded text-blue-600"
                  />
                  <span className="text-sm text-slate-600 dark:text-zinc-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900 dark:text-white">Skills</label>
            <div className="flex flex-wrap gap-2">
              {SKILLS.slice(0, 8).map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleArrayFilter("skills", skill)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    localFilters.skills?.includes(skill)
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-zinc-300"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Clear All */}
          <button
            onClick={clearAll}
            className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
          >
            Clear All Filters
          </button>
        </div>
      </aside>
    </>
  );
}