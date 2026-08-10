import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProject } from "../../services/api/projects.api.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatTimeAgo, formatTimeLeft } from "../../utils/date.utils.js";
import { useAuth } from "../../hooks/useAuth.js";
import Spinner from "../../components/loaders/Spinner.jsx";
import Button from "../../components/ui/Button.jsx";
import { SealMark } from "../auth/components/AuthShell.jsx";

function Meta({ children }) {
  return <span className="text-sm text-slate-300">{children}</span>;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-xl tracking-tight text-slate">This project couldn't be loaded</h1>
        <p className="mt-2 text-sm text-slate-300">{error.message}</p>
        <Link to="/projects">
          <Button variant="secondary" className="mt-6">
            Back to all projects
          </Button>
        </Link>
      </div>
    );
  }

  const project = data.data;
  const clientName =
    project.client_id?.client_profile?.organization_name || project.client_id?.name || "Client";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-slate-300 transition-colors hover:text-brass"
      >
        <span aria-hidden="true">←</span> All projects
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
            {project.category || "General"} · Posted {formatTimeAgo(project.createdAt)}
          </p>
          <h1 className="mt-2 font-display text-2xl leading-tight tracking-tight text-slate sm:text-3xl">
            {project.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Meta>{formatTimeLeft(project.deadline)}</Meta>
            <Meta>Remote</Meta>
            {typeof project.proposals_count === "number" && (
              <Meta>{project.proposals_count} proposals</Meta>
            )}
          </div>

          <div className="mt-6 rounded-card border border-ink-300 bg-ink-50 p-6 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">The brief</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">
              {project.description}
            </p>

            {project.required_skills?.length > 0 && (
              <div className="mt-6 border-t border-ink-300 pt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">
                  Skills required
                </p>
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
              </div>
            )}

            <div className="mt-6 border-t border-ink-300 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">
                About the client
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {clientName} · hires through NexusWork escrow.
              </p>
            </div>
          </div>
        </div>

        <aside className="rounded-card border border-ink-300 bg-ink-50 p-6 shadow-card lg:sticky lg:top-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Budget</p>
          <p className="mt-1 font-display text-3xl tracking-tight text-brass">
            {formatCurrency(project.budget)}
          </p>
          <p className="mt-1 text-xs text-slate-300">Fixed price</p>

          {user ? (
            <Button className="mt-6 w-full">Submit a proposal</Button>
          ) : (
            <>
              <p className="mt-6 text-sm leading-relaxed text-slate-300">
                Sign in with your university email to submit a proposal.
              </p>
              <Link to="/login" className="block">
                <Button className="mt-3 w-full">Sign in to apply</Button>
              </Link>
            </>
          )}

          <p className="mt-5 flex items-start gap-2 border-t border-ink-300 pt-4 text-xs leading-relaxed text-slate-300">
            <SealMark className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass" />
            Milestones are funded into escrow before work starts.
          </p>
        </aside>
      </div>
    </div>
  );
}
