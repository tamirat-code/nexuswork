import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, BadgeCheck, Sparkles, Users } from "lucide-react";
import { getProject } from "../../services/api/projects.api.js";
import { submitProposal, listProjectProposals, acceptProposal, getCommissionPreview } from "../../services/api/proposals.api.js";
import { getStudentMatchesForProject } from "../../services/api/recommendation.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatTimeAgo, formatTimeLeft } from "../../utils/date.utils.js";
import { StatusBadge } from "../../components/ui/shadcn/status-badge.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Textarea } from "../../components/ui/shadcn/textarea.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Separator } from "../../components/ui/shadcn/separator.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/shadcn/avatar.jsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/shadcn/dialog.jsx";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../components/ui/shadcn/form.jsx";
import { ROLES } from "../../constants/roles.constants.js";

const proposalSchema = z.object({
  price: z.coerce.number().min(1, "Enter a price").max(1000000),
  delivery_time_days: z.coerce.number().int().min(1, "Enter delivery time in days").max(365),
  cover_note: z.string().min(40, "Explain your experience and plan (min 40 characters)").max(2000),
});

function VerificationRequiredNotice() {
  return (
    <div className="rounded-control border border-brass/20 bg-brass/5 p-4">
      <p className="flex items-start gap-2 text-sm font-semibold text-slate">
        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
        Verify your university first
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
        Clients only see proposals from verified students. Submit your university details from your profile — most
        requests are reviewed within a couple of days.
      </p>
      <Link to="/profile" className="mt-3 block">
        <Button variant="outline" className="w-full" size="sm">
          Get verified
        </Button>
      </Link>
    </div>
  );
}

function ProposalSubmitDialog({ projectId, token, verified, currency = "USD" }) {
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(proposalSchema),
    defaultValues: { price: "", delivery_time_days: 7, cover_note: "" },
  });
  const proposalPrice = form.watch("price");
  const { data: commissionRes, isLoading: commissionLoading } = useQuery({
    queryKey: ["commission-preview", proposalPrice],
    queryFn: () => getCommissionPreview({ amount: proposalPrice, currency }, token),
    enabled: !!token && verified,
  });
  const commissionPreview = commissionRes?.data;

  const mutation = useMutation({
    mutationFn: (payload) => submitProposal(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-proposals", projectId] });
      toast.success("Proposal submitted — the client has been notified.");
    },
    onError: (err) => toast.error(err.message || "Could not submit proposal"),
  });

  if (!verified) return <VerificationRequiredNotice />;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">Submit a proposal</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit your proposal</DialogTitle>
          <DialogDescription>Clients compare price, timeline, and cover notes side by side. Be specific.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate({ ...v, project_id: projectId }))} className="space-y-4">
            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem><FormLabel>Your price ({currency})</FormLabel>
                <FormControl><Input type="number" min={1} className="font-mono" placeholder="500" {...field} /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="delivery_time_days" render={({ field }) => (
              <FormItem><FormLabel>Delivery time (days)</FormLabel>
                <FormControl><Input type="number" min={1} max={365} {...field} /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="cover_note" render={({ field }) => (
              <FormItem><FormLabel>Cover note</FormLabel>
                <FormControl><Textarea rows={5} placeholder="Why are you the right person? What's your approach?" {...field} /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <div className="rounded-control border border-brass/20 bg-brass/5 p-3 text-xs text-slate-300">
              <p className="font-semibold text-slate">Your estimated payout</p>
              <p className="mt-1">
                {commissionLoading ? "Checking your current commission rate…" : commissionPreview
                  ? `${commissionPreview.waived ? "Commission waived" : `${(commissionPreview.rateBps / 100).toFixed(2)}% commission`} · Estimated payout ${Number(commissionPreview.studentPayout ?? 0).toFixed(2)} ${currency}`
                  : "Commission details will appear before submission."}
              </p>
            </div>
            <DialogFooter>
              <Button type="submit" loading={mutation.isPending}>Submit proposal</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ClientProposalList({ projectId, token, currency = "USD" }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["project-proposals", projectId],
    queryFn: () => listProjectProposals(projectId, token),
    enabled: !!token,
  });

  const acceptMutation = useMutation({
    mutationFn: (id) => acceptProposal(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-proposals", projectId] });
      toast.success("Proposal accepted — contract created");
    },
    onError: (err) => toast.error(err.message || "Could not accept proposal"),
  });

  const proposals = data?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-brass" />
        <h2 className="font-display text-lg text-slate">Incoming proposals ({proposals.length})</h2>
      </div>

      {isLoading && <><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></>}
      {!isLoading && proposals.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-sm text-slate-300">No proposals yet. Share this project to attract students.</p>
        </Card>
      )}

      {proposals.map((p) => (
        <Card key={p._id} className="animate-fade-up">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar>
                  <AvatarImage src={p.student_id?.avatar} alt="" />
                  <AvatarFallback>{(p.student_id?.name || "S").slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate">{p.student_id?.name || "Student"}</p>
                  <Badge variant="success" className="mt-0.5"><BadgeCheck className="h-3 w-3" /> University verified</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg font-semibold text-brass">{formatCurrency(p.price, currency)}</p>
                <p className="text-xs text-slate-300">{p.delivery_time_days} days</p>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">{p.cover_note}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-300 pt-3">
              <StatusBadge kind="proposal" status={p.status} showDot />
              <div className="flex gap-2">
                {p.status === "pending" && (
                  <Button size="sm" loading={acceptMutation.isPending} onClick={() => acceptMutation.mutate(p._id)}>
                    Accept &amp; create contract
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecommendedStudents({ projectId, token }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-student-matches", projectId],
    queryFn: () => getStudentMatchesForProject(projectId, token),
    enabled: !!token,
  });

  const matches = data?.data ?? [];
  if (!isLoading && matches.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brass" />
        <h2 className="font-display text-lg text-slate">Recommended students</h2>
      </div>
      <p className="text-sm text-slate-300">Verified students whose skills best match this brief — no proposal required yet.</p>

      {isLoading && <><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></>}

      {matches.map((m) => (
        <Card key={m.user._id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar>
                <AvatarImage src={m.user.avatar_url} alt="" />
                <AvatarFallback>{(m.user.name || "S").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate">{m.user.name || "Student"}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(m.skills || []).slice(0, 4).map((s) => (
                    <Badge key={s.name} variant="secondary" className="text-xs">{s.name}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="shrink-0 gap-1"><Sparkles className="h-3 w-3" /> {Math.round((m.match_score || 0) * 100)}% match</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user, token, refreshMe } = useAuth();
  const { data, isLoading, error } = useQuery({ queryKey: ["project", id], queryFn: () => getProject(id) });

  // The "submit proposal" gate below reads user.universityVerified from the cached auth
  // object, which is only set at login and doesn't track server-side changes on its own.
  // AuthProvider re-syncs it opportunistically (on app load, on tab focus), but a student
  // who gets approved and then navigates straight here via an in-app link — without the
  // window ever losing focus — would still see a stale "not verified" gate. Refresh right
  // where it's actually checked, so the one place this matters is always correct on load.
  useEffect(() => {
    if (user?.role === "student" && !user?.universityVerified) {
      refreshMe().catch(() => {
        /* best-effort — falls back to whatever's cached */
      });
    }
    // Only re-run when the student identity changes, not on every refreshMe/user re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <h1 className="font-display text-xl text-slate">Project couldn't be loaded</h1>
        <p className="mt-2 text-sm text-slate-300">{error.message}</p>
        <Link to="/projects" className="mt-6 inline-block"><Button variant="secondary">Back to projects</Button></Link>
      </Card>
    );
  }

  const project = data.data;
  const isClientOwner = user?.role === ROLES.CLIENT && String(project.client_id) === String(user._id);
  const isStudent = user?.role === ROLES.STUDENT;
  const clientName = project.client_id?.client_profile?.organization_name || project.client_id?.name || "Client";

  return (
    <div className="w-full animate-fade-up">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-300 transition-colors hover:text-brass">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            {project.category || "General"} · Posted {formatTimeAgo(project.createdAt)}
          </p>
          <h1 className="mt-1 font-display text-2xl leading-tight tracking-tight text-slate sm:text-3xl">{project.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-300">
            <span>{formatTimeLeft(project.deadline)}</span>
            <span>Remote</span>
            {typeof project.proposals_count === "number" && <span>{project.proposals_count} proposals</span>}
          </div>
        </div>
        <StatusBadge kind="project" status={project.status} showDot />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">The brief</CardTitle></CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{project.description}</p>
              {project.required_skills?.length > 0 && (
                <div className="mt-5 border-t border-ink-300 pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Skills required</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {project.required_skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
              )}
              <div className="mt-5 border-t border-ink-300 pt-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">About the client</p>
                <p className="mt-2 text-sm text-slate-300">{clientName} · hires through NexusWork escrow.</p>
              </div>
            </CardContent>
          </Card>

          {isClientOwner && <ClientProposalList projectId={id} token={token} currency={project.currency || "USD"} />}
          {isClientOwner && <RecommendedStudents projectId={id} token={token} />}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardContent className="p-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Budget</p>
              <p className="mt-1 font-display text-3xl tracking-tight text-brass">{formatCurrency(project.budget, project.currency || "USD")}</p>
              <p className="text-xs text-slate-300">Fixed price</p>

              {isStudent ? (
                <div className="mt-6"><ProposalSubmitDialog projectId={id} token={token} verified={Boolean(user?.universityVerified)} currency={project.currency || "USD"} /></div>
              ) : !isClientOwner && !user ? (
                <>
                  <p className="mt-6 text-sm leading-relaxed text-slate-300">Sign in with your university email to submit a proposal.</p>
                  <Link to="/login" className="mt-3 block"><Button className="w-full">Sign in to apply</Button></Link>
                </>
              ) : isClientOwner ? (
                <p className="mt-6 text-sm text-slate-300">You posted this project. Review proposals below.</p>
              ) : null}

              <Separator className="my-5" />
              <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
                <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass" />
                Milestones are funded into escrow before work starts.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
