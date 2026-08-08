import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProject } from "../../services/api/projects.api.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";
import Spinner from "../../components/loaders/Spinner.jsx";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id),
  });

  if (isLoading) return <div className="p-6">{<Spinner />}</div>;
  if (error) return <p className="p-6 text-brick">{error.message}</p>;

  const project = data.data;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate">{project.title}</h1>
      <p className="text-slate-300 mt-2">{project.description}</p>
      <div className="mt-4 flex gap-4 text-sm text-slate-300">
        <span>Budget: {formatCurrency(project.budget)}</span>
        <span>Deadline: {formatDate(project.deadline)}</span>
        <span>Status: {project.status}</span>
      </div>
      <div className="mt-4 flex gap-2 flex-wrap">
        {project.required_skills?.map((s) => (
          <span key={s} className="text-xs bg-ink-50 border border-ink-300 rounded px-2 py-1 text-slate-300">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}