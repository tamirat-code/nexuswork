import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProject } from "../../services/api/projects.api.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatTimeAgo, formatTimeLeft } from "../../utils/date.utils.js";
import { useAuth } from "../../hooks/useAuth.js";
import Spinner from "../../components/loaders/Spinner.jsx";
import Button from "../../components/ui/Button.jsx";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id),
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  if (error) return <p className="p-6 text-center text-brick">{error.message}</p>;

  const project = data.data;
  const clientName = project.client_id?.client_profile?.organization_name || project.client_id?.name || "Client";

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-brass">
        <span aria-hidden="true">←</span> All projects
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">
            {project.category || "General"} · Posted {formatTimeAgo(project.createdAt)}
          </p>
          <h1 className="mt-2 font-display text-3xl text-slate">{project.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <span>{formatTimeLeft(project.deadline)}</span>
            <span className="flex items-center gap-1">Remote</span>
            {typeof project.proposals_count === "number" && (
              <span>{project.proposals_count} proposals</span>
            )}
          </div>

          <div className="mt-6 rounded-card border border-ink-300 bg-ink-50 p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-brass">The brief</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">
              {project.description}
            </p>

            {project.required_skills?.length > 0 && (
              <>
                <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-brass">Skills required</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.required_skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-ink-300 bg-ink px-3 py-1 text-xs text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </>
            )}

            <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-brass">About the client</p>
            <p className="mt-3 text-sm text-slate-300">
              {clientName} · hires through NexusWork escrow.
            </p>
          </div>
        </div>

        <aside className="h-fit rounded-card border border-ink-300 bg-ink-50 p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">Budget</p>
          <p className="mt-1 font-display text-3xl text-brass">{formatCurrency(project.budget)}</p>
          <p className="mt-0.5 text-xs text-slate-300">Fixed price</p>

          {user ? (
            <Button className="mt-6 w-full">Submit a proposal</Button>
          ) : (
            <>
              <p className="mt-6 text-sm text-slate-300">Sign in with your university email to submit a proposal.</p>
              <Link to="/login">
                <Button className="mt-3 w-full">Sign in to apply</Button>
              </Link>
            </>
          )}

          <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-300">
            <span aria-hidden="true">🔒</span> Milestones are funded before work starts
          </p>
        </aside>
      </div>
    </div>
  );
}