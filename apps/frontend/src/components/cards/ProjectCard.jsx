import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatTimeAgo, formatTimeLeft } from "../../utils/date.utils.js";

export default function ProjectCard({ project }) {
  const clientName =
    project.client_id?.client_profile?.organization_name || project.client_id?.name || "Client";
  const extraSkills = Math.max((project.required_skills?.length ?? 0) - 3, 0);

  return (
    <Link
      to={`/projects/${project._id}`}
      className="group flex h-full flex-col rounded-card border border-ink-300 bg-ink-50 p-5 shadow-card transition-colors hover:border-brass/40"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
          {project.category || "General"} · {clientName}
        </p>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tracking-tight text-brass">
            {formatCurrency(project.budget)}
          </p>
          <p className="text-[11px] text-slate-300">Fixed price</p>
        </div>
      </div>

      <h3 className="mt-2.5 font-display text-base leading-snug tracking-tight text-slate transition-colors group-hover:text-brass">
        {project.title}
      </h3>

      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-300">{project.description}</p>

      {project.required_skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.required_skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-ink-300 bg-ink px-2.5 py-0.5 text-xs text-slate-300"
            >
              {skill}
            </span>
          ))}
          {extraSkills > 0 && (
            <span className="rounded-full border border-ink-300 bg-ink px-2.5 py-0.5 text-xs text-slate-300">
              +{extraSkills}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-ink-300 pt-3 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{formatTimeLeft(project.deadline)}</span>
          <span aria-hidden="true">·</span>
          <span>Remote</span>
          {typeof project.proposals_count === "number" && (
            <>
              <span aria-hidden="true">·</span>
              <span>{project.proposals_count} proposals</span>
            </>
          )}
        </div>
        <span>{formatTimeAgo(project.createdAt)}</span>
      </div>
    </Link>
  );
}
