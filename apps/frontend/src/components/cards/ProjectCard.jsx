import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";

export default function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project._id}`} className="block border border-ink-300 rounded p-4 hover:bg-ink-50">
      <h2 className="font-medium text-slate">{project.title}</h2>
      <p className="text-sm text-slate-300 line-clamp-2">{project.description}</p>
      <div className="flex gap-2 mt-2 text-xs text-slate-300">
        <span>{formatCurrency(project.budget)}</span>
        <span>·</span>
        <span>{formatDate(project.deadline)}</span>
      </div>
    </Link>
  );
}