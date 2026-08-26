import { isValidElement } from "react";
import Skeleton from "../loaders/Skeleton.jsx";
import Tooltip from "../ui/Tooltip.jsx";
import { cn } from "../../lib/cn.js";

const deltaTones = {
  up: "text-success",
  down: "text-danger",
  flat: "text-content-muted",
};

function renderIcon(Icon, className = "h-4 w-4") {
  if (!Icon) return null;
  if (isValidElement(Icon)) return Icon;
  const Component = Icon;
  return <Component className={className} />;
}

/**
 * Stat / MetricCard — Dominant metric value display for workspace dashboards.
 * Hierarchy: Label → Dominant Value → Supporting Context / Trend.
 * Handles zero & empty states cleanly without raw unstyled em dashes.
 */
export default function Stat({
  label,
  value,
  hint,
  delta,
  deltaDirection = "flat",
  icon: Icon,
  loading = false,
  className = "",
}) {
  // Clean fallback for em dashes
  const displayValue = value === "—" ? "0" : value;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-card border border-border bg-surface p-5 shadow-card transition-all duration-150 hover:border-brand/30 hover:shadow-elevated",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-content-secondary">
          {label}
          {hint && (
            <Tooltip content={hint}>
              <button
                type="button"
                aria-label={`What does ${label} mean?`}
                className="grid h-4 w-4 place-items-center rounded-full bg-surface-soft text-[10px] text-content-muted transition-colors hover:bg-brand-soft hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                ?
              </button>
            </Tooltip>
          )}
        </p>
        {Icon && (
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-brand-soft text-brand">
            {renderIcon(Icon, "h-4 w-4")}
          </div>
        )}
      </div>

      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <p className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-content-primary tabular-nums leading-none">
            {displayValue}
          </p>
        )}
      </div>

      {(hint || delta) && (
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/50 pt-2 text-xs">
          {hint && <span className="truncate text-content-muted">{hint}</span>}
          {delta && !loading && (
            <span className={cn("inline-flex items-center gap-1 font-medium shrink-0", deltaTones[deltaDirection])}>
              {deltaDirection !== "flat" && (
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={cn("h-3 w-3", deltaDirection === "down" && "rotate-180")}>
                  <path d="M6 9.5V2.5M3 5.5 6 2.5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {delta}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** Responsive grid wrapper for stats */
export function StatGrid({ children, className = "" }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>
  );
}
