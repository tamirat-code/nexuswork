import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatTimeAgo, formatTimeLeft } from "../../utils/date.utils.js";

/* Strictly professional marketplace tones: Teal, Cyan, Blue, Emerald, Amber, Slate — NO Pink / Rose / Purple */
const CATEGORY_TAG_STYLES = {
  Development: "border-teal-500/30 bg-teal-500/10 text-teal-800 dark:text-teal-300",
  Design: "border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-300",
  "Data & Research": "border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300",
  Writing: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300",
  "Video & Motion": "border-slate-500/30 bg-slate-500/10 text-slate-800 dark:text-slate-300",
  Marketing: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
};

export default function ProjectCard({ project }) {
  const clientName =
    project.client_id?.client_profile?.organization_name || project.client_id?.name || "Client";
  const extraSkills = Math.max((project.required_skills?.length ?? 0) - 3, 0);
  const categoryTagClass =
    CATEGORY_TAG_STYLES[project.category] || "border-brass/30 bg-brass/10 text-brass";

  return (
    <Link
      to={`/projects/${project._id}`}
      className="group flex h-full flex-col rounded-card border border-ink-300 bg-ink-50 p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brass/50 hover:shadow-elevated"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${categoryTagClass}`}
          >
            {project.category || "General"}
          </span>
          <span className="text-xs font-bold text-slate-400 sm:text-sm">· {clientName}</span>
        </div>

        <div className="shrink-0 rounded-control border border-brass/35 bg-brass/12 px-3.5 py-1.5 text-right shadow-card">
          <p className="font-mono text-base font-extrabold tracking-tight text-brass sm:text-lg">
            {formatCurrency(project.budget)}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fixed price</p>
        </div>
      </div>

      <h3 className="mt-4 font-display text-lg font-extrabold leading-snug tracking-tight text-slate transition-colors group-hover:text-brass sm:text-xl">
        {project.title}
      </h3>

      <p className="mt-2.5 line-clamp-2 text-base leading-relaxed text-slate-300">{project.description}</p>

      {project.required_skills?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {project.required_skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-ink-300 bg-ink-100 px-3 py-1 text-xs font-semibold text-slate-300 sm:text-sm"
            >
              {skill}
            </span>
          ))}
          {extraSkills > 0 && (
            <span className="rounded-full border border-ink-300 bg-ink-100 px-3 py-1 text-xs font-semibold text-slate-300 sm:text-sm">
              +{extraSkills}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto pt-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-ink-300/70 pt-3.5 text-xs text-slate-400 sm:text-sm">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-bold text-slate-300">{formatTimeLeft(project.deadline)}</span>
            <span aria-hidden="true">·</span>
            <span>Remote</span>
            {typeof project.proposals_count === "number" && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-300">{project.proposals_count} proposals</span>
              </>
            )}
          </div>
          <span>{formatTimeAgo(project.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
