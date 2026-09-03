import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkX } from "lucide-react";
import { Link } from "react-router-dom";
import { listSavedProjects, removeSavedProject } from "../../services/api/saved-projects.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatTimeLeft } from "../../utils/date.utils.js";
import { Card, CardContent } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { toast } from "sonner";

export default function SavedProjectsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["saved-projects"],
    queryFn: () => listSavedProjects(token),
    enabled: !!token,
  });
  const remove = useMutation({
    mutationFn: (projectId) => removeSavedProject(projectId, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-projects"] }),
    onError: (err) => toast.error(err.message || "Could not remove saved project"),
  });
  const saved = data?.data || [];

  return (
    <div className="w-full animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brass"><Bookmark className="h-3.5 w-3.5" /> Saved work</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Saved projects</h1>
        <p className="mt-2 text-sm text-slate-300">Keep interesting opportunities here so you can return to them later.</p>
      </header>

      {isLoading && <div className="mt-6 space-y-3"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>}
      {error && <p className="mt-6 rounded-card border border-brick/30 bg-brick-100 px-4 py-3 text-sm text-brick">{error.message}</p>}
      {!isLoading && !error && saved.length === 0 && (
        <Card className="mt-8 p-12 text-center"><Bookmark className="mx-auto h-9 w-9 text-brass" /><h2 className="mt-3 font-display text-lg text-slate">No saved projects yet</h2><p className="mt-2 text-sm text-slate-300">Browse the marketplace and save projects you want to revisit.</p><Link to="/projects" className="mt-5 inline-block"><Button variant="secondary">Browse projects</Button></Link></Card>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {saved.map((entry) => {
          const project = entry.project_id;
          if (!project) return null;
          return (
            <Card key={entry._id} className="flex flex-col border-brass/20">
              <CardContent className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3"><span className="rounded-full border border-brass/30 bg-brass/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brass">{project.category || "Project"}</span><span className="font-mono text-sm text-brass">{formatCurrency(project.budget, project.currency || "USD")}</span></div>
                <h2 className="mt-4 font-display text-lg text-slate">{project.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-slate-300">{project.description}</p>
                <div className="mt-auto flex items-center justify-between border-t border-ink-300 pt-4"><span className="text-xs text-slate-300">{formatTimeLeft(project.deadline)}</span><div className="flex gap-2"><Button size="sm" variant="ghost" aria-label="Remove saved project" onClick={() => remove.mutate(project._id)} disabled={remove.isPending}><BookmarkX className="h-4 w-4" /></Button><Link to={`/projects/${project._id}`}><Button size="sm" variant="secondary">View project</Button></Link></div></div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
