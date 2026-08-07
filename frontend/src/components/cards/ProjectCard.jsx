import { Calendar, Star, Wallet, ArrowRight } from "lucide-react";
import Button from "../ui/Button";

export default function ProjectCard({ project }) {
  return (
    <article className="card-hover flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {project.title}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-sm text-amber-500">
            <Star className="h-4 w-4 fill-current" aria-hidden="true" />
            <span className="font-semibold">{project.rating}</span>
            <span className="text-slate-500 dark:text-slate-400">
              Client rating
            </span>
          </div>
        </div>

        <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
          Open
        </span>
      </div>

      <p className="mb-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {project.description}
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {project.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/10 dark:text-blue-300"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
          <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Budget: {project.budget}
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
          <Calendar className="h-4 w-4 text-secondary" aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {project.deadline}
          </span>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 sm:flex-row">
        <Button
          to={`/projects/${project.id}`}
          variant="secondary"
          className="w-full sm:w-auto"
        >
          View Details
        </Button>

        <Button
          to={`/register?intent=apply-project-${project.id}`}
          variant="primary"
          className="w-full sm:w-auto"
        >
          Apply Now
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}