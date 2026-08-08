import { useQuery } from "@tanstack/react-query";
import { listProjects } from "../../services/api/projects.api.js";
import ProjectCard from "../../components/cards/ProjectCard.jsx";
import Spinner from "../../components/loaders/Spinner.jsx";

export default function ProjectListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects(),
  });

  if (isLoading) return <div className="p-6">{<Spinner />}</div>;
  if (error) return <p className="p-6 text-brick">{error.message}</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-slate">Open Projects</h1>
      <div className="space-y-4">
        {data.data.map((project) => (
          <ProjectCard key={project._id} project={project} />
        ))}
        {data.data.length === 0 && <p className="text-slate-300">No open projects yet.</p>}
      </div>
    </div>
  );
}