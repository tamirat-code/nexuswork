import Skeleton from "../loaders/Skeleton.jsx";
import Tooltip from "../ui/Tooltip.jsx";
import { cn } from "../../lib/cn.js";

const deltaTones = {
  up: "text-escrow",
  down: "text-brick",
  flat: "text-slate-300",
};


export default function Stat({
  label,
  value,
  hint,
  delta,
  deltaDirection = "flat",
  icon,
  loading = false,
  className = "",
}) {
  return (
    <div className={cn("rounded-card border border-ink-300 bg-ink-700 p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-300">
          {label}
          {hint && (
            <Tooltip content={hint}>
              <button
                type="button"
                aria-label={`What does ${label} mean?`}
                className="grid h-4 w-4 place-items-center rounded-full border border-ink-300 text-[10px] text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
              >
                ?
              </button>
            </Tooltip>
          )}
        </p>
        {icon && <span className="shrink-0 text-brass">{icon}</span>}
      </div>

      {loading ? (
        <Skeleton className="mt-3 h-8 w-24" />
      ) : (
        <p className="mt-2 font-display text-2xl text-slate tabular-nums sm:text-3xl">{value}</p>
      )}

      {delta && !loading && (
        <p className={cn("mt-2 flex items-center gap-1 text-xs font-medium", deltaTones[deltaDirection])}>
          {deltaDirection !== "flat" && (
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={cn("h-3 w-3", deltaDirection === "down" && "rotate-180")}>
              <path d="M6 9.5V2.5M3 5.5 6 2.5l3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {delta}
        </p>
      )}
    </div>
  );
}

/** Responsive grid wrapper so dashboards don't each invent their own columns. */
export function StatGrid({ children, className = "" }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>{children}</div>
  );
}
