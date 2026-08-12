import Button from "./Button.jsx";
import { cn } from "../../lib/cn.js";

function pageWindow(page, totalPages) {
  // Always show first, last, current and its neighbours; gaps become ellipses.
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  return [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
}


export default function Pagination({ page = 1, limit = 20, total = 0, onPageChange, className = "" }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const visible = pageWindow(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-col items-center gap-3 sm:flex-row sm:justify-between", className)}
    >
      <p className="text-xs text-slate-300 tabular-nums">
        Showing <span className="font-semibold text-slate">{from}</span>–
        <span className="font-semibold text-slate">{to}</span> of{" "}
        <span className="font-semibold text-slate">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          aria-label="Previous page"
        >
          Previous
        </Button>

        <ul className="hidden items-center gap-1 sm:flex">
          {visible.map((p, i) => {
            const prev = visible[i - 1];
            return (
              <li key={p} className="flex items-center gap-1">
                {prev && p - prev > 1 && (
                  <span className="px-1 text-slate-300" aria-hidden="true">
                    …
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onPageChange?.(p)}
                  aria-current={p === page ? "page" : undefined}
                  aria-label={`Page ${p}`}
                  className={cn(
                    "h-9 min-w-9 rounded-control px-2 text-sm font-semibold tabular-nums transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                    p === page ? "bg-brass/15 text-brass" : "text-slate-300 hover:bg-ink-50 hover:text-slate"
                  )}
                >
                  {p}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="px-2 text-xs text-slate-300 tabular-nums sm:hidden">
          {page} / {totalPages}
        </p>

        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange?.(page + 1)}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
