import { cn } from "../../lib/cn.js";

/** Shimmering placeholder block. Decorative: always hidden from screen readers. */
export default function Skeleton({ className = "" }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-control bg-gradient-to-r from-ink-50 via-ink-300 to-ink-50 bg-[length:200%_100%]",
        className
      )}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

/** Card-shaped placeholder matching the marketplace / dashboard list items. */
export function SkeletonCard({ className = "" }) {
  return (
    <div className={cn("rounded-card border border-ink-300 bg-ink-700 p-5", className)} aria-hidden="true">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <SkeletonText lines={2} className="mt-4" />
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, className = "" }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Skeleton rows sized to a DataTable with `columns` columns. */
export function SkeletonTable({ rows = 5, columns = 4, className = "" }) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: columns }).map((__, c) => (
            <Skeleton key={c} className={cn("h-4", c === 0 ? "w-1/3" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  );
}
