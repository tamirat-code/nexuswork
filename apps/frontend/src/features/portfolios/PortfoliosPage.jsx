import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FolderOpen, Plus, Sparkles, Trash2 } from "lucide-react";
import { getMyPortfolio, deletePortfolioEntry, createPortfolioEntry } from "../../services/api/portfolios.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/shadcn/dialog.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";

export default function PortfoliosPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["portfolio"], queryFn: () => getMyPortfolio(token), enabled: !!token });
  const entries = data?.data ?? [];

  const create = useMutation({
    mutationFn: () => createPortfolioEntry({ title, description, url }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolio"] }); setTitle(""); setDescription(""); setUrl(""); toast.success("Added to portfolio"); },
    onError: (err) => toast.error(err.message || "Could not add entry"),
  });
  const remove = useMutation({
    mutationFn: (id) => deletePortfolioEntry(id, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolio"] }); toast.success("Removed entry"); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>;

  return (
    <div className="w-full animate-fade-up">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-300 pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Showcase</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Portfolio</h1>
          <p className="mt-2 text-sm text-slate-300">Approved milestones and certificates, one click to publish.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add entry</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add portfolio entry</DialogTitle><DialogDescription>Share a completed milestone, certificate, or project.</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="pf-title">Title</Label><Input id="pf-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g. Campus club website" /></div>
              <div className="space-y-1.5"><Label htmlFor="pf-desc">Description</Label><Input id="pf-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What you built and the impact" /></div>
              <div className="space-y-1.5"><Label htmlFor="pf-url">Project URL</Label><Input id="pf-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></div>
            </div>
            <DialogFooter><Button size="sm" loading={create.isPending} onClick={() => create.mutate()}>Add to portfolio</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {entries.length === 0 && (
        <Card className="mt-8 p-14 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-brass" />
          <h3 className="mt-4 font-display text-lg text-slate">Your portfolio is waiting</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-300">Add approved milestones with one click — clients love proof of work from real contracts.</p>
        </Card>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((e) => (
          <Card key={e._id} className="group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <FolderOpen className="h-8 w-8 text-brass" />
                <Button variant="ghost" size="sm" className="h-8 w-8 text-brick opacity-0 transition-opacity group-hover:opacity-100" onClick={() => remove.mutate(e._id)} aria-label="Remove entry"><Trash2 className="h-4 w-4" /></Button>
              </div>
              <h3 className="mt-3 font-display text-base text-slate">{e.title}</h3>
              <p className="mt-1 line-clamp-3 text-sm text-slate-300">{e.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {e.milestone_id && <Badge variant="secondary" className="text-xs">Milestone</Badge>}
                {e.consent_status === "pending" && <Badge variant="outline" className="text-xs">Awaiting client consent</Badge>}
                {e.consent_status === "denied" && <Badge variant="outline" className="text-xs">Private</Badge>}
                {e.consent_status === "approved" && <Badge variant="secondary" className="text-xs">Published</Badge>}
              </div>
              {e.project_url && <a href={e.project_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-brass hover:underline">View project →</a>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
