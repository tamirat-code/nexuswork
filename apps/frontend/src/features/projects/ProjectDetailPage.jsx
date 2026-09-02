import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, BadgeCheck, Sparkles, Users } from "lucide-react";
import { getProject, updateProject, closeProject } from "../../services/api/projects.api.js";
import { listSkills } from "../../services/api/skills.api.js";
import { submitProposal, listProjectProposals, acceptProposal, markProposalCvViewed, getCommissionPreview } from "../../services/api/proposals.api.js";
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
import { uploadFile, openFilePreview } from "../../services/api/files.api.js";
import { reportValidation } from "../../lib/validation.js";

const PROJECT_CATEGORIES = [
  ["web-development", "Web Development"],
  ["mobile-development", "Mobile Development"],
  ["data-science-ml", "Data Science & ML"],
  ["ui-ux-design", "UI/UX Design"],
  ["graphic-design", "Graphic Design"],
  ["writing-content", "Writing & Content"],
  ["marketing-seo", "Marketing & SEO"],
  ["research-analysis", "Research & Analysis"],
  ["engineering-cad", "Engineering & CAD"],
  ["video-animation", "Video & Animation"],
  ["translation-languages", "Translation & Languages"],
  ["other", "Other"],
];

const LEGACY_CATEGORY_VALUES = {
  Development: "web-development",
  Design: "ui-ux-design",
  "Data & Research": "data-science-ml",
  Writing: "writing-content",
  "Video & Motion": "video-animation",
  Marketing: "marketing-seo",
};

const proposalSchema = z.object({
  price: z.coerce.number().min(1, "Enter a price").max(1000000),
  delivery_time_days: z.coerce.number().int().min(1, "Enter delivery time in days").max(365),
  cover_note: z.string().min(40, "Explain your experience and plan (min 40 characters)").max(2000),
});

function VerificationRequiredNotice() {
  const { t } = useTranslation();
  return (
    <div className="rounded-control border border-brass/20 bg-brass/5 p-4">
      <p className="flex items-start gap-2 text-sm font-semibold text-slate">
        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
        {t("projects.verifyFirst", { defaultValue: "Verify your university first" })}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
        {t("projects.verifiedOnly", { defaultValue: "Clients only see proposals from verified students. Submit your university details from your profile — most requests are reviewed within a couple of days." })}
      </p>
      <Link to="/profile?section=verification" className="mt-3 block">
        <Button variant="outline" className="w-full" size="sm">
          {t("projects.getVerified", { defaultValue: "Get verified" })}
        </Button>
      </Link>
    </div>
  );
}

function ProposalSubmitDialog({ projectId, token, verified, currency = "USD", projectStatus = "open" }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [cvFile, setCvFile] = useState(null);
  const cvUpload = useMutation({ mutationFn: (file) => uploadFile(file, { relatedType: "cv", token }), onSuccess: (response) => setCvFile(response.data), onError: (error) => toast.error(error.message || "Could not upload your CV") });
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

  if (projectStatus !== "open") return <p className="rounded-control border border-ink-300 bg-ink-50 p-3 text-sm text-slate-300">{t("projects.projectClosed", { defaultValue: "This project is no longer accepting proposals." })}</p>;
  if (!verified) return <VerificationRequiredNotice />;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">{t("projects.submitProposal", { defaultValue: "Submit a proposal" })}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("projects.submitYourProposal", { defaultValue: "Submit your proposal" })}</DialogTitle>
          <DialogDescription>{t("projects.proposalHint", { defaultValue: "Clients compare price, timeline, and cover notes side by side. Be specific." })}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate({ ...v, project_id: projectId }))} className="space-y-4">
            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem><FormLabel>{t("projects.yourPrice", { currency, defaultValue: `Your price (${currency})` })}</FormLabel>
                <FormControl><Input type="number" min={1} className="font-mono" placeholder="500" {...field} /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="delivery_time_days" render={({ field }) => (
              <FormItem><FormLabel>{t("projects.deliveryDays", { defaultValue: "Delivery time (days)" })}</FormLabel>
                <FormControl><Input type="number" min={1} max={365} {...field} /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="cover_note" render={({ field }) => (
              <FormItem><FormLabel>{t("projects.coverNote", { defaultValue: "Cover note" })}</FormLabel>
                <FormControl><Textarea rows={5} placeholder="Why are you the right person? What's your approach?" {...field} /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <div className="space-y-1.5"><FormLabel>CV / resume (PDF or document)</FormLabel><Input type="file" accept=".pdf,.doc,.docx" onChange={(event) => event.target.files?.[0] && cvUpload.mutate(event.target.files[0])} />{cvFile ? <p className="text-xs text-escrow">Attached: {cvFile.original_name}</p> : <p className="text-xs text-slate-300">Upload your CV before submitting.</p>}</div>
            <div className="rounded-control border border-brass/20 bg-brass/5 p-3 text-xs text-slate-300">
              <p className="font-semibold text-slate">Your estimated payout</p>
              <p className="mt-1">
                {commissionLoading ? "Checking your current commission rate…" : commissionPreview
                  ? `${commissionPreview.waived ? "Commission waived" : `${(commissionPreview.rateBps / 100).toFixed(2)}% commission`} · Estimated payout ${formatCurrency(commissionPreview.studentPayout ?? 0, currency)}`
                  : "Commission details will appear before submission."}
              </p>
            </div>
            <DialogFooter>
              <Button type="submit" loading={mutation.isPending} disabled={!cvFile || cvUpload.isPending}>{t("projects.submitProposal", { defaultValue: "Submit proposal" })}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ClientProposalList({ projectId, token, currency = "USD" }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [cvViewed, setCvViewed] = useState({});
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
  async function viewCv(proposal) {
    const file = proposal.cv_file_id;
    if (!file?._id) { const message = "This proposal has no CV attached and cannot be approved."; toast.error(message); reportValidation(message, { form: "proposal-approval", proposalId: proposal._id }); return; }
    try {
    await openFilePreview(file._id, token);
      await markProposalCvViewed(proposal._id, token);
      setCvViewed((current) => ({ ...current, [proposal._id]: true }));
    } catch (error) { toast.error(error.message || "Could not open CV"); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-brass" />
        <h2 className="font-display text-lg text-slate">{t("projects.incomingProposals", { count: proposals.length, defaultValue: `Incoming proposals (${proposals.length})` })}</h2>
      </div>

      {isLoading && <><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></>}
      {!isLoading && proposals.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-sm text-slate-300">{t("projects.noProposals", { defaultValue: "No proposals yet. Share this project to attract students." })}</p>
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
                  <Badge variant="success" className="mt-0.5"><BadgeCheck className="h-3 w-3" /> {t("projects.universityVerified", { defaultValue: "University verified" })}</Badge>
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
                  <>
                    {p.cv_file_id && <Button size="sm" variant="outline" onClick={() => viewCv(p)}>{t("projects.viewCv", { defaultValue: "View CV" })}</Button>}
                    <Button size="sm" loading={acceptMutation.isPending} disabled={!cvViewed[p._id]} title={!cvViewed[p._id] ? "View the CV before approving" : undefined} onClick={() => acceptMutation.mutate(p._id)}>
                      Accept &amp; create contract
                    </Button>
                  </>
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
  const { t } = useTranslation();
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
        <h2 className="font-display text-lg text-slate">{t("projects.recommendedStudents", { defaultValue: "Recommended students" })}</h2>
      </div>
      <p className="text-sm text-slate-300">{t("projects.recommendedHint", { defaultValue: "Verified students whose skills best match this brief — no proposal required yet." })}</p>

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

function EditProjectDialog({ project, token, projectId }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("intermediate");
  const [budgetType, setBudgetType] = useState("fixed");
  const [budget, setBudget] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const { data: skillsResponse } = useQuery({
    queryKey: ["skills", "project-edit"],
    queryFn: () => listSkills(),
    enabled: open,
  });
  const skillCatalog = skillsResponse?.data || [];

  useEffect(() => {
    if (!open || project.required_skill_ids?.length || !project.required_skills?.length || !skillCatalog.length) return;
    setSelectedSkills(skillCatalog
      .filter((skill) => project.required_skills.some((name) => name.toLowerCase() === skill.name.toLowerCase() || name.toLowerCase() === skill.slug.toLowerCase()))
      .map((skill) => String(skill._id)));
  }, [open, project.required_skill_ids, project.required_skills, skillCatalog]);

  function openEditor() {
    setTitle(project.title || "");
    setDescription(project.description || "");
    setCategory(LEGACY_CATEGORY_VALUES[project.category] || project.category || "");
    setExperienceLevel(project.experience_level || "intermediate");
    setBudgetType(project.budget_type || "fixed");
    setBudget(project.budget ?? "");
    setBudgetMin(project.budget_min ?? "");
    setBudgetMax(project.budget_max ?? project.budget ?? "");
    setSelectedSkills((project.required_skill_ids || []).map((id) => String(id)));
    setOpen(true);
  }

  const mutation = useMutation({
    mutationFn: () => updateProject(projectId, {
      title,
      description,
      category,
      experience_level: experienceLevel,
      budget_type: budgetType,
      budget: Number(budgetType === "range" ? budgetMax : budget),
      ...(budgetType === "range" ? { budget_min: Number(budgetMin), budget_max: Number(budgetMax) } : {}),
      required_skill_ids: selectedSkills,
    }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setOpen(false);
      toast.success("Project updated");
    },
    onError: (error) => toast.error(error.message || "Could not update project"),
  });

  const availableSkills = skillCatalog.filter((skill) => !selectedSkills.includes(String(skill._id)));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={openEditor}>{t("projects.editProject", { defaultValue: "Edit project" })}</Button>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("projects.editProject", { defaultValue: "Edit project" })}</DialogTitle><DialogDescription>{t("projects.onlyOpenEditable", { defaultValue: "Only open projects can be edited." })}</DialogDescription></DialogHeader>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div><label className="text-sm font-medium text-slate">Title</label><Input className="mt-1" value={title} onChange={(event) => setTitle(event.target.value)} /></div>
          <div><label className="text-sm font-medium text-slate">Description</label><Textarea className="mt-1" rows={5} value={description} onChange={(event) => setDescription(event.target.value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="text-sm font-medium text-slate">Category</label><select className="mt-1 h-11 w-full rounded-control border border-ink-300 bg-ink-100 px-3 text-sm text-slate" value={category} onChange={(event) => setCategory(event.target.value)}>{PROJECT_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div><label className="text-sm font-medium text-slate">Experience</label><select className="mt-1 h-11 w-full rounded-control border border-ink-300 bg-ink-100 px-3 text-sm text-slate" value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)}>{["beginner", "intermediate", "advanced", "expert"].map((level) => <option key={level} value={level}>{level}</option>)}</select></div>
          </div>
          <div><label className="text-sm font-medium text-slate">Budget type</label><select className="mt-1 h-11 w-full rounded-control border border-ink-300 bg-ink-100 px-3 text-sm text-slate" value={budgetType} onChange={(event) => setBudgetType(event.target.value)}><option value="fixed">Fixed budget</option><option value="range">Budget range</option></select></div>
          {budgetType === "range" ? (
            <div className="grid gap-3 sm:grid-cols-2"><div><label className="text-sm font-medium text-slate">Minimum</label><Input className="mt-1" type="number" min="10" value={budgetMin} onChange={(event) => setBudgetMin(event.target.value)} /></div><div><label className="text-sm font-medium text-slate">Maximum</label><Input className="mt-1" type="number" min="10" value={budgetMax} onChange={(event) => setBudgetMax(event.target.value)} /></div></div>
          ) : <div><label className="text-sm font-medium text-slate">Budget</label><Input className="mt-1" type="number" min="10" value={budget} onChange={(event) => setBudget(event.target.value)} /></div>}
          <div><label className="text-sm font-medium text-slate">Required skills</label><select className="mt-1 h-11 w-full rounded-control border border-ink-300 bg-ink-100 px-3 text-sm text-slate" value="" onChange={(event) => { if (event.target.value) setSelectedSkills([...selectedSkills, event.target.value]); }}><option value="">Add a skill</option>{availableSkills.map((skill) => <option key={skill._id} value={skill._id}>{skill.name}</option>)}</select><div className="mt-2 flex flex-wrap gap-1.5">{selectedSkills.map((id) => { const skill = skillCatalog.find((item) => String(item._id) === id); return skill ? <Badge key={id} variant="secondary">{skill.name}<button type="button" className="ml-1" onClick={() => setSelectedSkills(selectedSkills.filter((item) => item !== id))}>×</button></Badge> : null; })}</div></div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>{t("common.cancel", { defaultValue: "Cancel" })}</Button><Button loading={mutation.isPending} onClick={() => mutation.mutate()}>{t("common.save", { defaultValue: "Save changes" })}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user, token, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["project", id], queryFn: () => getProject(id) });
  const closeMutation = useMutation({
    mutationFn: () => closeProject(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project closed");
    },
    onError: (closeError) => toast.error(closeError.message || "Could not close project"),
  });

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
        <h1 className="font-display text-xl text-slate">{t("projects.loadError", { defaultValue: "Project couldn't be loaded" })}</h1>
        <p className="mt-2 text-sm text-slate-300">{error.message}</p>
        <Link to="/projects" className="mt-6 inline-block"><Button variant="secondary">{t("projects.backToProjects", { defaultValue: "Back to projects" })}</Button></Link>
      </Card>
    );
  }

  const project = data.data;
  const isClientOwner = user?.role === ROLES.CLIENT && String(project.client_id?._id || project.client_id) === String(user._id);
  const isStudent = user?.role === ROLES.STUDENT;
  const clientName = project.client_id?.client_profile?.organization_name || project.client_id?.name || "Client";

  return (
    <div className="w-full animate-fade-up">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-300 transition-colors hover:text-brass">
        <ArrowLeft className="h-4 w-4" /> {t("projects.allProjects", { defaultValue: "All projects" })}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            {project.category || "General"} · Posted {formatTimeAgo(project.createdAt)}
          </p>
          <h1 className="mt-1 font-display text-2xl leading-tight tracking-tight text-slate sm:text-3xl">{project.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-300">
            <span>{formatTimeLeft(project.deadline)}</span>
            <span>{t("projects.remote", { defaultValue: "Remote" })}</span>
            {typeof project.proposals_count === "number" && <span>{t("projects.proposals", { count: project.proposals_count, defaultValue: `${project.proposals_count} proposals` })}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2"><StatusBadge kind="project" status={project.status} showDot />{isClientOwner && project.status === "open" && <><EditProjectDialog project={project} projectId={id} token={token} /><Button size="sm" variant="outline" loading={closeMutation.isPending} onClick={() => { if (window.confirm("Close this project? It will stop accepting proposals.")) closeMutation.mutate(); }}>Close project</Button></>}</div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">{t("projects.brief", { defaultValue: "The brief" })}</CardTitle></CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{project.description}</p>
              {project.required_skills?.length > 0 && (
                <div className="mt-5 border-t border-ink-300 pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">{t("projects.skillsRequired", { defaultValue: "Skills required" })}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {project.required_skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
              )}
              <div className="mt-5 border-t border-ink-300 pt-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">{t("projects.aboutClient", { defaultValue: "About the client" })}</p>
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
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">{t("projects.budget", { defaultValue: "Budget" })}</p>
              <p className="mt-1 font-display text-3xl tracking-tight text-brass">
                {project.budget_type === "range"
                  ? `${formatCurrency(project.budget_min, project.currency || "USD")} – ${formatCurrency(project.budget_max, project.currency || "USD")}`
                  : formatCurrency(project.budget, project.currency || "USD")}
              </p>
              <p className="text-xs text-slate-300">{project.budget_type === "range" ? "Budget range" : "Fixed price"}</p>

              {isStudent ? (
                <div className="mt-6"><ProposalSubmitDialog projectId={id} token={token} verified={Boolean(user?.universityVerified)} currency={project.currency || "USD"} projectStatus={project.status} /></div>
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
