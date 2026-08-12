import { useEffect, useState } from "react";
import { cn } from "../../lib/cn.js";


export default function SearchInput({
  value = "",
  onChange,
  onDebouncedChange,
  delay = 350,
  placeholder = "Search…",
  label = "Search",
  hideLabel = true,
  className = "",
  id,
}) {
  const [local, setLocal] = useState(value);
  const inputId = id || "search-input";

  // Keep in sync when the parent resets the query (e.g. "clear all filters").
  useEffect(() => setLocal(value), [value]);

  useEffect(() => {
    if (!onDebouncedChange) return;
    const timer = setTimeout(() => {
      if (local !== value) onDebouncedChange(local);
    }, delay);
    return () => clearTimeout(timer);
  }, [local, delay, onDebouncedChange, value]);

  return (
    <div className={cn("w-full", className)}>
      <label htmlFor={inputId} className={hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium text-slate-300"}>
        {label}
      </label>
      <div className="relative">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
        >
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" strokeLinecap="round" />
        </svg>

        <input
          id={inputId}
          type="search"
          role="searchbox"
          value={local}
          placeholder={placeholder}
          onChange={(e) => {
            setLocal(e.target.value);
            onChange?.(e.target.value);
          }}
          className={cn(
            "h-11 w-full rounded-control border border-ink-300 bg-ink pl-10 pr-10 text-sm text-slate",
            "placeholder:text-slate-300/70 transition-colors",
            "focus:border-brass/60 focus:outline-none focus:ring-2 focus:ring-brass/30",
            "[&::-webkit-search-cancel-button]:hidden"
          )}
        />

        {local && (
          <button
            type="button"
            onClick={() => {
              setLocal("");
              onChange?.("");
              onDebouncedChange?.("");
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-300 transition-colors hover:bg-ink-50 hover:text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
