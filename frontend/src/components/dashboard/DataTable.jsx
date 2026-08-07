import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";

export default function DataTable({
  columns,
  data,
  searchableKeys = [],
  pageSize = 5,
  selectable = false,
  bulkActions = [],
  exportName,
  onRowClick,
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: null, dir: 1 });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState([]);

  const filtered = useMemo(() => {
    let rows = data;
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter((r) =>
        searchableKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q))
      );
    }
    if (sort.key) {
      rows = [...rows].sort(
        (a, b) => (a[sort.key] > b[sort.key] ? 1 : a[sort.key] < b[sort.key] ? -1 : 0) * sort.dir
      );
    }
    return rows;
  }, [data, query, sort, searchableKeys]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const rows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: 1 }));

  const toggleRow = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const allPageSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const toggleAll = () =>
    setSelected(
      allPageSelected
        ? selected.filter((id) => !rows.some((r) => r.id === id))
        : [...new Set([...selected, ...rows.map((r) => r.id)])]
    );

  const exportCsv = () => {
    const cols = columns.map((c) => c.key || c.header);
    const lines = [cols.join(",")];
    filtered.forEach((r) =>
      lines.push(cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","))
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = `${exportName || "export"}.csv`;
    a.click();
  };

  const th = "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500";
  const td = "px-4 py-3 text-sm text-slate-700 dark:text-zinc-300";

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {searchableKeys.length > 0 && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder="Search…"
              className="w-56 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {selected.length > 0 &&
            bulkActions.map((b) => (
              <button
                key={b.label}
                onClick={() => { b.onClick(selected); setSelected([]); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  b.tone === "danger" ? "bg-red-600 text-white hover:bg-red-700" : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {b.label} ({selected.length})
              </button>
            ))}
          {exportName && (
            <button
              onClick={exportCsv}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5">
        <table className="w-full min-w-[560px] border-collapse">
          <thead className="bg-slate-50 dark:bg-white/[0.02]">
            <tr>
              {selectable && (
                <th className={th}>
                  <input type="checkbox" checked={allPageSelected} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300" aria-label="Select all rows" />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.header} className={th}>
                  {c.sortable ? (
                    <button onClick={() => toggleSort(c.key)} className="flex items-center gap-1 uppercase hover:text-slate-600 dark:hover:text-zinc-300">
                      {c.header} <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => onRowClick && onRowClick(r)}
                className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] ${
                  selected.includes(r.id) ? "bg-blue-50/60 dark:bg-blue-500/5" : ""
                }`}
              >
                {selectable && (
                  <td className={td} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={() => toggleRow(r.id)}
                      className="h-4 w-4 rounded border-slate-300"
                      aria-label={`Select row ${r.id}`}
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.header} className={td}>{c.render ? c.render(r) : r[c.key]}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-10 text-center text-sm text-slate-400">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
        <span>
          Showing {filtered.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-1">
          <button disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 dark:border-white/10" aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 font-semibold">{safePage + 1} / {pages}</span>
          <button disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 dark:border-white/10" aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}