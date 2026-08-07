import { Star, Briefcase, ArrowRight } from "lucide-react";
import Button from "../ui/Button";

export default function FreelancerCard({ freelancer }) {
  return (
    <article className="card-hover flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-soft dark:border-slate-800 dark:bg-slate-900">
      {/* Avatar with premium gradient ring */}
      <div
        className={`mx-auto mb-5 h-20 w-20 rounded-full bg-gradient-to-br ${freelancer.gradient} p-[3px] shadow-lg`}
      >
        {freelancer.image ? (
          <img
            src={freelancer.image}
            alt={`${freelancer.name}, verified student freelancer at ${freelancer.university}`}
            loading="lazy"
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-xl font-extrabold text-primary dark:bg-slate-900 dark:text-blue-300">
            {freelancer.initials}
          </div>
        )}
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
        {freelancer.name}
      </h3>

      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {freelancer.university}
      </p>

      <div className="mt-3 flex items-center justify-center gap-2 text-amber-500">
        <Star className="h-4 w-4 fill-current" aria-hidden="true" />
        <span className="font-bold">{freelancer.rating}</span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <Briefcase className="h-4 w-4" aria-hidden="true" />
        {freelancer.completedProjects} completed projects
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {freelancer.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {skill}
          </span>
        ))}
      </div>

      <Button
        to={`/talent/${freelancer.id}`}
        variant="primary"
        className="mt-6 w-full"
      >
        Hire Student
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </article>
  );
}