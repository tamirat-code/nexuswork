import { cn } from "../../lib/cn.js";
import { SkeletonTable } from "../loaders/Skeleton.jsx";
import { EmptyState } from "../feedback/States.jsx";


const hideClasses = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

export default function DataTable({
  columns = [],
  rows = [],
  caption,
  loading = false,
  sort,
  onSortChange,
  rowKey = (row, i) => row.id ?? i,
  onRowClick,
  empty,
  className = "",
}) {
  if (loading) {
    return (
      <div className={cn("rounded-card border border-ink-300 bg-ink-700 p-5", className)}>
        <SkeletonTable rows={5} columns={columns.length} />
      </div>
    );
  }

  if (rows.length === 0) {
    return empty ?? <EmptyState title="Nothing here yet" description="Once there's data it will appear in this table." />;
  }

  function toggleSort(key) {
    if (!onSortChange) return;
    const direction = sort?.key === key && sort.direction === "asc" ? "desc" : "asc";
    onSortChange({ key, direction });
  }

  return (
    <div className={cn("overflow-x-auto rounded-card border border-ink-300 bg-ink-700", className)}>
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-ink-300">
            {columns.map((col) => {
              const isSorted = sort?.key === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={isSorted ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-300",
                    col.align === "right" && "text-right",
                    col.hideBelow && hideClasses[col.hideBelow],
                    col.className
                  )}
                >
                  {col.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                    >
                      {col.label}
                      <svg
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                        className={cn(
                          "h-3 w-3 transition-transform",
                          isSorted ? "text-brass" : "opacity-40",
                          isSorted && sort.direction === "desc" && "rotate-180"
                        )}
                      >
                        <path d="M6 9.5V2.5M3 5.5 6 2.5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-ink-300/60 last:border-0",
                onRowClick && "cursor-pointer transition-colors hover:bg-ink-50"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-3 align-middle text-slate-300",
                    col.align === "right" && "text-right",
                    col.hideBelow && hideClasses[col.hideBelow],
                    col.className
                  )}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
