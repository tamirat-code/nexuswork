import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3, MapPin, ShieldCheck, Users } from "lucide-react";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatTimeAgo, formatTimeLeft } from "../../utils/date.utils.js";
import { useTranslation } from "react-i18next";

const CATEGORY_TAG_STYLES = {
  Development: "border-brand/30 bg-brand-soft text-brand-dark",
  Design: "border-info/30 bg-info/10 text-info",
  "Data & Research": "border-info/40 bg-info-soft text-info",
  Writing: "border-amber/35 bg-amber/10 text-amber",
  "Video & Motion": "border-border-strong bg-surface-muted text-content-secondary",
  Marketing: "border-success/35 bg-success-soft text-success",
};

export default function ProjectCard({ project }) {
  const { t } = useTranslation();
  const clientName =
    project.client_id?.client_profile?.organization_name || project.client_id?.name || t("projects.client", { defaultValue: "Client" });
  const extraSkills = Math.max((project.required_skills?.length ?? 0) - 3, 0);
  const categoryTagClass =
    CATEGORY_TAG_STYLES[project.category] || "border-brass/30 bg-brass/10 text-brass";

  return (
    <Link
      to={`/projects/${project._id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-card border border-border-subtle bg-surface p-5 shadow-subtle transition-all duration-200 hover:-translate-y-1 hover:border-brand/45 hover:shadow-elevated sm:p-6"
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-brand/0 transition-colors group-hover:bg-brand/70" aria-hidden="true" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${categoryTagClass}`}
          >
            {project.category || t("projects.general", { defaultValue: "General" })}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-content-muted sm:text-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" /> {clientName}
          </span>
        </div>

        <div className="shrink-0 rounded-control border border-brand/25 bg-brand-soft px-3.5 py-2 text-right">
          <p className="font-mono text-base font-extrabold tracking-tight text-brand-dark sm:text-lg">
            {formatCurrency(project.budget, project.currency || "USD")}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-content-muted">{t("projects.fixedPrice", { defaultValue: "Fixed price" })}</p>
        </div>
      </div>

      <div className="mt-6 flex items-start justify-between gap-4">
      <h3 className="line-clamp-2 min-h-[3.2rem] break-words font-display text-lg font-extrabold leading-snug tracking-tight text-content-primary transition-colors group-hover:text-brand-dark sm:text-xl">
        {project.title}
      </h3>
      <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-content-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
      </div>

      <p className="mt-2 line-clamp-2 min-h-[3.25rem] text-sm leading-relaxed text-content-secondary sm:text-[15px]">{project.description}</p>

      {project.required_skills?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {project.required_skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border-subtle bg-surface-soft px-3 py-1 text-xs font-semibold text-content-secondary sm:text-sm"
            >
              {skill}
            </span>
          ))}
          {extraSkills > 0 && (
            <span className="rounded-full border border-border-subtle bg-surface-soft px-3 py-1 text-xs font-semibold text-content-secondary sm:text-sm">
              +{extraSkills}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto pt-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border-subtle pt-4 text-xs text-content-muted sm:text-sm">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5 font-bold text-content-primary"><Clock3 className="h-3.5 w-3.5 text-brand" /> {formatTimeLeft(project.deadline)}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {t("projects.remote", { defaultValue: "Remote" })}</span>
            {typeof project.proposals_count === "number" && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-content-secondary"><Users className="h-3.5 w-3.5" /> {t("projects.proposals", { count: project.proposals_count, defaultValue: `${project.proposals_count} proposals` })}</span>
            )}
          </div>
          <span>{formatTimeAgo(project.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
