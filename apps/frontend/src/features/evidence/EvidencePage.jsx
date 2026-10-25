import { useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, FileText, GitBranch, GitCommitHorizontal, Info, Link2, Milestone, Plus, RefreshCw, RotateCcw, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { listEvidence, createEvidence, listCheckpoints, decideCheckpoint, listRepositories, startRepositoryOAuth, syncRepository, revokeRepository } from "../../services/api/evidence.api.js";
import { uploadFile } from "../../services/api/files.api.js";
import { listMilestones } from "../../services/api/milestones.api.js";
import { validHttpUrl } from "../../lib/validation.js";
import { Alert, Badge, Button, EmptyState, ErrorState, FileUpload, Input, LoadingState, PageHeader, Select, Textarea } from "../../components/ui/index.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";

const EVIDENCE_TYPES = [
  { value: "text", label: "Note", icon: FileText, hint: "Share a concise progress update." },
  { value: "link", label: "Link", icon: Link2, hint: "Point to a design, demo, or external deliverable." },
  { value: "upload", label: "File", icon: UploadCloud, hint: "Attach a document, image, or deliverable." },
];

function responseArray(value, key) {
  if (Array.isArray(value)) return value;
  if (key && Array.isArray(value?.[key])) return value[key];
  return [];
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function artifactMeta(item) {
  if (item.kind === "commit") return { label: "Repository commit", tone: "brand", icon: GitCommitHorizontal };
  if (item.kind === "check_in") return { label: "Check-in", tone: "warning", icon: Clock3 };
  if (item.kind === "upload") return { label: "File", tone: "neutral", icon: UploadCloud };
  if (item.kind === "link") return { label: "Link", tone: "purple", icon: Link2 };
  return { label: "Note", tone: "info", icon: FileText };
}

function RepositoryIcon({ provider }) {
  return <GitBranch className="h-4 w-4" aria-hidden="true" />;
}

function ConnectionStatus({ connection }) {
  if (connection.status === "active") return <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" />}>Connected</Badge>;
  if (connection.status === "needs_reauthorization") return <Badge tone="warning" icon={<AlertTriangle className="h-3 w-3" />}>Reconnect required</Badge>;
  return <Badge tone="neutral">Disconnected</Badge>;
}

function ArtifactCard({ item, milestoneMap }) {
  const meta = artifactMeta(item);
  const Icon = meta.icon;
  const milestoneId = item.milestone_id?._id || item.milestone_id;
  const milestoneTitle = item.milestone_id?.title || milestoneMap.get(String(milestoneId));
  return (
    <article className="relative rounded-card border border-border-subtle bg-surface p-4 shadow-card transition-colors hover:border-brand/30 sm:p-5">
      <div className="flex gap-3">
        <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><Icon className="h-4 w-4" aria-hidden="true" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge tone={meta.tone}>{meta.label}</Badge>{milestoneTitle && <Badge tone="neutral" icon={<Milestone className="h-3 w-3" />}>{milestoneTitle}</Badge>}</div><h3 className="mt-2 break-words font-display text-base font-bold text-content-primary">{item.title || meta.label}</h3></div>
            <time className="shrink-0 text-xs text-content-muted" dateTime={item.occurred_at || item.createdAt}>{formatDate(item.occurred_at || item.createdAt)}</time>
          </div>
          {item.body && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-content-secondary">{item.body}</p>}
          {item.url && <a className="mt-3 flex min-w-0 items-start gap-1.5 break-all text-sm text-brand underline-offset-2 hover:underline" href={item.url} target="_blank" rel="noreferrer"><ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{item.url}</a>}
          {item.file_id?.url && <a className="mt-3 flex min-w-0 items-center gap-1.5 text-sm text-brand underline-offset-2 hover:underline" href={item.file_id.url} target="_blank" rel="noreferrer"><FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{item.file_id.original_name || "Open attached file"}</a>}
          {item.metadata?.sha && <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs text-content-muted"><span>{item.metadata.sha.slice(0, 12)}</span><span aria-hidden="true">·</span><span>{item.provider || "repository"}</span>{item.metadata.author_verified === false && <span className="font-sans">· author not provider-verified</span>}</p>}
        </div>
      </div>
    </article>
  );
}

export default function EvidencePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const formRef = useRef(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [repo, setRepo] = useState("");
  const [provider, setProvider] = useState("github");
  const [syncMilestone, setSyncMilestone] = useState("");
  const [evidenceType, setEvidenceType] = useState("text");
  const [file, setFile] = useState(null);
  const [formError, setFormError] = useState("");
  const isStudent = user?.role === "student";
  const evidence = useQuery({ queryKey: ["evidence", id], queryFn: () => listEvidence(id, token), enabled: Boolean(id && token) });
  const repositories = useQuery({ queryKey: ["evidence-repositories", id], queryFn: () => listRepositories(id, token), enabled: Boolean(id && token) });
  const checkpoints = useQuery({ queryKey: ["evidence-checkpoints", id], queryFn: () => listCheckpoints(id, token), enabled: Boolean(id && token) });
  const milestones = useQuery({ queryKey: ["milestones", id], queryFn: () => listMilestones(id, token), enabled: Boolean(id && token) });
  const items = responseArray(evidence.data?.data);
  const repositoryItems = responseArray(repositories.data?.data);
  const checkpointItems = responseArray(checkpoints.data?.data);
  const milestoneItems = responseArray(milestones.data?.data, "milestones");
  const milestoneMap = useMemo(() => new Map(milestoneItems.map((item) => [String(item._id), item.title])), [milestoneItems]);
  const activeConnectionCount = repositoryItems.filter((connection) => connection.status === "active").length;

  const refresh = () => { queryClient.invalidateQueries({ queryKey: ["evidence", id] }); queryClient.invalidateQueries({ queryKey: ["evidence-repositories", id] }); queryClient.invalidateQueries({ queryKey: ["evidence-checkpoints", id] }); };
  const add = useMutation({ mutationFn: (kind) => createEvidence(id, { kind, title: title.trim(), body: body.trim(), ...(kind === "link" ? { url: url.trim() } : {}) }, token), onSuccess: () => { setTitle(""); setBody(""); setUrl(""); setFormError(""); refresh(); toast.success(t("evidence.saved", { defaultValue: "Evidence update saved" })); }, onError: (error) => setFormError(error.message || "Could not save this evidence update.") });
  const addFile = useMutation({ mutationFn: async () => { const uploaded = await uploadFile(file, { relatedType: "contract", relatedId: id, token }); return createEvidence(id, { kind: "upload", title: title.trim(), body: body.trim(), file_id: uploaded.data._id }, token); }, onSuccess: () => { setTitle(""); setBody(""); setFile(null); setFormError(""); refresh(); toast.success(t("evidence.saved", { defaultValue: "Evidence update saved" })); }, onError: (error) => setFormError(error.message || "Could not upload this evidence.") });
  const connect = useMutation({ mutationFn: ({ nextProvider, repository }) => startRepositoryOAuth(id, nextProvider, repository, token), onSuccess: ({ data }) => window.location.assign(data.authorization_url), onError: (error) => toast.error(error.message || "Could not start repository authorization.") });
  const sync = useMutation({ mutationFn: ({ connectionId, milestoneId }) => syncRepository(connectionId, { milestone_id: milestoneId || null }, token), onSuccess: ({ data }) => { refresh(); toast.success(t("evidence.synced", { defaultValue: `${data.imported} commits synchronized` })); }, onError: (error) => toast.error(error.message || "Could not synchronize the repository.") });
  const revoke = useMutation({ mutationFn: (connectionId) => revokeRepository(connectionId, token), onSuccess: refresh, onError: (error) => toast.error(error.message || "Could not revoke the repository.") });
  const checkpoint = useMutation({ mutationFn: (status) => decideCheckpoint(id, { status, note: body.trim() }, token), onSuccess: () => { setBody(""); refresh(); toast.success(t("evidence.checkpointSaved", { defaultValue: "Checkpoint decision saved" })); }, onError: (error) => toast.error(error.message || "Could not save the checkpoint decision.") });

  function submitManualEvidence(event) {
    event.preventDefault();
    if (!title.trim()) return setFormError("Add a title so this update is easy to find later.");
    if (evidenceType === "text" && !body.trim()) return setFormError("Describe what changed in this update.");
    if (evidenceType === "link" && !validHttpUrl(url)) return setFormError("Enter a complete http:// or https:// link.");
    if (evidenceType === "upload" && !file) return setFormError("Choose a file to attach.");
    if (evidenceType === "upload") return addFile.mutate();
    return add.mutate(evidenceType);
  }

  function connectRepository(event) {
    event.preventDefault();
    const repository = repo.trim();
    if (!repository) return toast.error("Enter a repository as owner/name.");
    connect.mutate({ nextProvider: provider, repository });
  }

  function reconnect(connection) {
    setProvider(connection.provider);
    setRepo(connection.repository);
    connect.mutate({ nextProvider: connection.provider, repository: connection.repository });
  }

  if (evidence.isLoading) return <LoadingState label="Loading work evidence…" />;
  if (evidence.error) return <ErrorState title="Work evidence could not be loaded" description={evidence.error.message} onRetry={() => evidence.refetch()} />;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader breadcrumbs={[{ label: "Contracts", to: "/contracts" }, { label: "Work evidence" }]} eyebrow="Contract workspace" title="Work Evidence" description="Keep progress, deliverables, and repository activity together in one descriptive timeline for everyone on the contract." actions={isStudent ? <Button onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}><Plus className="h-4 w-4" />Add evidence</Button> : null} meta={<><Badge tone="info" icon={<ShieldCheck className="h-3 w-3" />}>Descriptive record</Badge>{activeConnectionCount > 0 && <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" />}>{activeConnectionCount} repository{activeConnectionCount === 1 ? "" : "ies"} connected</Badge>}</>} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <div ref={formRef} className="scroll-mt-6"><Card><CardHeader><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><Plus className="h-5 w-5" aria-hidden="true" /></div><div><CardTitle>Add manual evidence</CardTitle><p className="mt-1.5 text-sm leading-relaxed text-content-secondary">Use a note, link, or file when the work is not represented by a repository commit.</p></div></div></CardHeader><CardContent><form className="space-y-4" onSubmit={submitManualEvidence}><Input label="Title" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Homepage layout draft" /><Textarea label="Description" required={evidenceType === "text"} value={body} onChange={(event) => setBody(event.target.value)} rows={4} maxLength={10000} showCount placeholder="Describe what changed, what is ready to review, or what is blocked." /><div role="tablist" aria-label="Evidence type" className="grid grid-cols-3 gap-2 rounded-card border border-border-subtle bg-surface-soft p-1.5">{EVIDENCE_TYPES.map((type) => { const Icon = type.icon; const selected = evidenceType === type.value; return <button key={type.value} type="button" role="tab" aria-selected={selected} onClick={() => { setEvidenceType(type.value); setFormError(""); }} className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-control px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${selected ? "bg-surface text-brand shadow-subtle" : "text-content-secondary hover:bg-surface hover:text-content-primary"}`}><Icon className="h-4 w-4" aria-hidden="true" /><span>{type.label}</span></button>; })}</div><p className="text-xs text-content-secondary">{EVIDENCE_TYPES.find((type) => type.value === evidenceType)?.hint}</p>{evidenceType === "link" && <Input label="Evidence link" required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://github.com/..." hint="Use a complete public http:// or https:// URL." />}{evidenceType === "upload" && <FileUpload label="Attachment" accept="*/*" maxSizeMb={10} hint="Up to 10 MB · drag and drop or browse" files={file ? [{ id: "selected", name: file.name, size: file.size }] : []} onFilesSelected={(files) => setFile(files[0] || null)} onRemove={() => setFile(null)} disabled={addFile.isPending} />}{formError && <Alert variant="danger" title="Check this update" live>{formError}</Alert>}<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4"><p className="text-xs text-content-muted">Saved updates become part of the contract record.</p><Button type="submit" loading={add.isPending || addFile.isPending}>{evidenceType === "upload" ? "Upload evidence" : evidenceType === "link" ? "Save link" : "Save update"}</Button></div></form></CardContent></Card></div>

          <Card><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>Evidence timeline</CardTitle><p className="mt-1.5 text-sm text-content-secondary">A dated record of updates, links, files, check-ins, and repository activity.</p></div><Badge tone="neutral">{items.length} {items.length === 1 ? "entry" : "entries"}</Badge></div></CardHeader><CardContent className="space-y-3">{items.map((item) => <ArtifactCard key={item._id} item={item} milestoneMap={milestoneMap} />)}{!items.length && <EmptyState icon={Sparkles} title="No evidence yet" description="Add a progress note, attach a deliverable, or connect a repository when work begins." action={isStudent ? <Button size="sm" onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}><Plus className="h-4 w-4" />Add first update</Button> : null} />}</CardContent></Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card><CardHeader><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><GitBranch className="h-5 w-5" aria-hidden="true" /></div><div><CardTitle>Repository activity</CardTitle><p className="mt-1.5 text-sm leading-relaxed text-content-secondary">Connect one approved repository to bring commit activity into this timeline.</p></div></div></CardHeader><CardContent className="space-y-4">{isStudent ? <form className="space-y-3" onSubmit={connectRepository}><Select label="Provider" value={provider} onChange={(event) => setProvider(event.target.value)} options={[{ value: "github", label: "GitHub" }, { value: "gitlab", label: "GitLab" }]} /><Input label="Repository" required value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="owner/repository" hint="Example: tamirat-code/nexuswork" /><Select label="Milestone for sync" optional value={syncMilestone} onChange={(event) => setSyncMilestone(event.target.value)} options={[{ value: "", label: "Entire contract" }, ...milestoneItems.map((item) => ({ value: item._id, label: item.title }))]} /><Button type="submit" fullWidth loading={connect.isPending}><RepositoryIcon provider={provider} />{connect.isPending ? "Opening authorization…" : "Connect repository"}</Button><p className="flex items-start gap-2 text-xs leading-relaxed text-content-muted"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />Only commits from this exact repository are imported. NexusWork never exposes your access token.</p></form> : <Alert variant="info" title="Student-managed connection">The contracted student controls repository authorization. You can review synchronized activity below.</Alert>}{repositories.isLoading && <LoadingState label="Checking repository connections…" className="py-6" />}{repositories.error && <Alert variant="danger" title="Connection status unavailable" actions={<Button size="sm" variant="secondary" onClick={() => repositories.refetch()}>Try again</Button>}>{repositories.error.message}</Alert>}{!repositories.isLoading && !repositories.error && !repositoryItems.length && <div className="rounded-card border border-dashed border-border-subtle bg-surface-soft p-4 text-center"><GitBranch className="mx-auto h-5 w-5 text-content-muted" aria-hidden="true" /><p className="mt-2 text-sm font-semibold text-content-primary">No repository connected</p><p className="mt-1 text-xs leading-relaxed text-content-secondary">Connect GitHub or GitLab to make commit activity visible to the contract team.</p></div>}{repositoryItems.map((connection) => <div key={connection._id} className="rounded-card border border-border-subtle bg-surface-soft p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><RepositoryIcon provider={connection.provider} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-content-primary">{connection.repository}</p><p className="text-xs uppercase tracking-wide text-content-muted">{connection.provider}</p></div></div><ConnectionStatus connection={connection} /></div><p className="mt-3 text-xs leading-relaxed text-content-secondary">{connection.last_sync_at ? `Last synchronized ${formatDate(connection.last_sync_at)}` : "Not synchronized yet"}</p>{connection.last_sync_error && <p className="mt-2 break-words text-xs text-danger">{connection.last_sync_error}</p>}<div className="mt-3 flex flex-wrap gap-2">{connection.status === "active" && <Button size="sm" variant="secondary" loading={sync.isPending} onClick={() => sync.mutate({ connectionId: connection._id, milestoneId: syncMilestone })}><RefreshCw className="h-3.5 w-3.5" />Sync commits</Button>}{isStudent && connection.status === "needs_reauthorization" && <Button size="sm" loading={connect.isPending} onClick={() => reconnect(connection)}><RotateCcw className="h-3.5 w-3.5" />Reconnect</Button>}{isStudent && connection.status !== "revoked" && <Button size="sm" variant="ghost" loading={revoke.isPending} onClick={() => revoke.mutate(connection._id)}>Revoke</Button>}</div></div>)}</CardContent></Card>

          {!isStudent && <Card><CardHeader><CardTitle>Checkpoint review</CardTitle><p className="mt-1.5 text-sm text-content-secondary">Record a review decision without turning evidence into an automatic performance score.</p></CardHeader><CardContent className="space-y-3"><Textarea label="Review note" optional value={body} onChange={(event) => setBody(event.target.value)} rows={3} placeholder="What is ready, or what needs another pass?" /><div className="grid grid-cols-2 gap-2"><Button loading={checkpoint.isPending} onClick={() => checkpoint.mutate("approved")}><CheckCircle2 className="h-4 w-4" />Approve</Button><Button variant="outline" loading={checkpoint.isPending} onClick={() => checkpoint.mutate("revision_requested")}><RotateCcw className="h-4 w-4" />Revision</Button></div></CardContent></Card>}
          <Card><CardHeader><CardTitle>Review history</CardTitle></CardHeader><CardContent className="space-y-2">{!checkpointItems.length && <p className="text-sm text-content-secondary">No checkpoint decisions have been recorded.</p>}{checkpointItems.map((item) => <div key={item._id} className="rounded-control border border-border-subtle bg-surface-soft p-3"><div className="flex items-center justify-between gap-2"><Badge tone={item.status === "approved" ? "success" : item.status === "revision_requested" ? "warning" : "neutral"}>{item.status.replaceAll("_", " ")}</Badge><time className="text-xs text-content-muted">{formatDate(item.decided_at || item.createdAt)}</time></div>{item.note && <p className="mt-2 text-sm leading-relaxed text-content-secondary">{item.note}</p>}</div>)}</CardContent></Card>
        </aside>
      </div>
    </div>
  );
}
