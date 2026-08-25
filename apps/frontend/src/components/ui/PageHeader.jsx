import Breadcrumbs from "./Breadcrumbs.jsx";
import { cn } from "../../lib/cn.js";


export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  meta,
  eyebrow,
  className = "",
}) {
  return (
    <header className={cn("mb-7 space-y-3", className)}>
      {breadcrumbs?.length > 0 && <Breadcrumbs items={breadcrumbs} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brass">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display font-extrabold leading-tight tracking-tight text-slate">
            {title}
          </h1>
          {description && (
            <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-slate-300">
              {description}
            </p>
          )}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
