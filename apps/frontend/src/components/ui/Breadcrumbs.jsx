import { Link } from "react-router-dom";
import { cn } from "../../lib/cn.js";


export default function Breadcrumbs({ items = [], className = "" }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-3 w-3 opacity-50">
                  <path d="m6 3.5 4 4.5-4 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {isLast || !item.to ? (
                <span aria-current={isLast ? "page" : undefined} className={cn("truncate", isLast && "text-slate")}>
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="truncate transition-colors hover:text-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
