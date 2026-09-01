import { useMemo, useRef, useState,useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Flag,
  History,
  MessageSquare,
  Paperclip,
  RefreshCcw,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { getContract, signContract, listContractMilestones, reviewContract } from "../../services/api/contracts.api.js";
import {
  approveMilestone,
  createMilestone,
  fundMilestone,
  requestMilestoneRevision,
  retryMilestoneRelease,
  startMilestoneWork,
  submitMilestoneWork,
} from "../../services/api/milestones.api.js";
import { listMilestoneSubmissions } from "../../services/api/submissions.api.js";
import FundMilestoneDialog from "./FundMilestoneDialog.jsx";
import { openDispute } from "../../services/api/disputes.api.js";
import { listMessages, sendMessage } from "../../services/api/messages.api.js";
import { deleteFile, uploadFile, fetchFileBlob, downloadFile, getFileContentUrl } from "../../services/api/files.api.js";
import { getMilestonePortfolioConsent, respondToMilestonePortfolioConsent } from "../../services/api/portfolios.api.js";
import { createMeeting, listContractMeetings } from "../../services/api/meetings.api.js";
import ReviewsSection from "../reviews/ReviewsSection.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";
import { StatusBadge } from "../../components/ui/shadcn/status-badge.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Textarea } from "../../components/ui/shadcn/textarea.jsx";
import { Separator } from "../../components/ui/shadcn/separator.jsx";
import { Progress } from "../../components/ui/shadcn/progress.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/shadcn/dialog.jsx";
import { ROLES } from "../../constants/roles.constants.js";
import { MILESTONE_STATUS } from "../../constants/payment.constants.js";
import { reportValidation } from "../../lib/validation.js";

const REVIEWABLE_STATUSES = [MILESTONE_STATUS.SUBMITTED, MILESTONE_STATUS.DELIVERED];
const DISPUTABLE_STATUSES = [
  MILESTONE_STATUS.FUNDED,
  MILESTONE_STATUS.IN_PROGRESS,
  MILESTONE_STATUS.SUBMITTED,
  MILESTONE_STATUS.DELIVERED,
  MILESTONE_STATUS.REVISION_REQUESTED,
];

function validContractFile(file) {
  if (!file?.size) return "The selected file is empty.";
  if (file.size > 10 * 1024 * 1024) return "Files must be 10 MB or smaller.";
  return "";
}

function MeetingCreateDialog({ contractId, token, onCreated }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [attempted, setAttempted] = useState(false);
  const titleMissing = attempted && !title.trim();
  const startMissing = attempted && !start;
  const endInvalid = attempted && start && end && new Date(end) <= new Date(start);
  const startPast = attempted && start && new Date(start) <= new Date();
  const mutation = useMutation({
    mutationFn: () => createMeeting({ contract_id: contractId, title: title.trim(), description: description.trim(), scheduled_start: new Date(start).toISOString(), scheduled_end: end ? new Date(end).toISOString() : null }, token),
    onSuccess: () => { setOpen(false); setTitle(""); setDescription(""); setStart(""); setEnd(""); setAttempted(false); onCreated?.(); toast.success("Meeting scheduled."); },
    onError: (error) => toast.error(error.message || "Could not schedule meeting"),
  });
  const submit = () => { setAttempted(true); if (!title.trim() || !start || startPast || endInvalid) return; mutation.mutate(); };
  const minStart = new Date(Date.now() + 60_000).toISOString().slice(0, 16);
  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setAttempted(false); }}><DialogTrigger asChild><Button size="sm" variant="secondary">Schedule meeting</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Schedule a video meeting</DialogTitle><DialogDescription>Invite the other participant on this contract.</DialogDescription></DialogHeader><div className="space-y-3"><div><Input aria-label="Meeting title" aria-invalid={titleMissing} placeholder="Meeting title" value={title} onChange={(e) => setTitle(e.target.value)} />{titleMissing && <p className="mt-1 text-xs text-brick">Enter a meeting title.</p>}</div><Textarea aria-label="Description" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} /><div className="grid gap-3 sm:grid-cols-2"><div><Input type="datetime-local" aria-label="Start time" aria-invalid={startMissing || startPast} min={minStart} value={start} onChange={(e) => setStart(e.target.value)} />{startMissing && <p className="mt-1 text-xs text-brick">Choose a start time.</p>}{startPast && <p className="mt-1 text-xs text-brick">Start time must be in the future.</p>}</div><div><Input type="datetime-local" aria-label="End time" aria-invalid={endInvalid} min={start || minStart} value={end} onChange={(e) => setEnd(e.target.value)} />{endInvalid && <p className="mt-1 text-xs text-brick">End time must be after start.</p>}</div></div></div><DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button loading={mutation.isPending} onClick={submit}>Schedule</Button></DialogFooter></DialogContent></Dialog>;
}

function ContractTermsSummary({ contract }) {
  const terms = contract?.terms || {};
  return (
    <div className="max-h-[45vh] space-y-4 overflow-y-auto rounded-control border border-ink-300 bg-ink-50 p-4 text-sm">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Agreement terms · Version {contract?.version || 1}</p>
        <h3 className="mt-1 font-display text-lg text-slate">{terms.title || "Contract"}</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><p className="text-xs text-slate-300">Total amount</p><p className="font-mono font-semibold text-brass">{formatCurrency(terms.total_amount || 0, terms.currency || "USD")}</p></div>
        <div><p className="text-xs text-slate-300">Delivery</p><p className="font-semibold text-slate">{terms.delivery_time_days || "—"} days</p></div>
      </div>
      <div><p className="text-xs text-slate-300">Scope</p><p className="mt-1 whitespace-pre-line leading-relaxed text-slate">{terms.description || "No description provided."}</p></div>
      <div><p className="text-xs text-slate-300">Payment terms</p><p className="mt-1 leading-relaxed text-slate">{terms.payment_terms || "Milestones are funded before work and released after approval."}</p></div>
      <div><p className="text-xs text-slate-300">Revisions</p><p className="mt-1 leading-relaxed text-slate">{terms.revision_policy || "As agreed in the project scope."}</p></div>
      <div><p className="text-xs text-slate-300">Cancellation</p><p className="mt-1 leading-relaxed text-slate">{terms.cancellation_terms || "Subject to NexusWork dispute and termination policy."}</p></div>
    </div>
  );
}

function ContractReviewDialog({ contract, open, onOpenChange, onConfirm, loading }) {
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => { if (!open) setConfirmed(false); }, [open]);
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) setConfirmed(false); onOpenChange(next); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review contract terms</DialogTitle>
          <DialogDescription>Read the complete agreement before recording your review.</DialogDescription>
        </DialogHeader>
        <ContractTermsSummary contract={contract} />
        <label className="flex items-start gap-3 rounded-control border border-ink-300 p-3 text-sm text-slate">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 accent-brass" />
          <span>I have reviewed the terms shown above and confirm they reflect the agreement I intend to sign.</span>
        </label>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!confirmed} loading={loading} onClick={onConfirm}>Confirm review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContractSignDialog({ contract, open, onOpenChange, onConfirm, loading }) {
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => { if (!open) setConfirmed(false); }, [open]);
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) setConfirmed(false); onOpenChange(next); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm your signature</DialogTitle>
          <DialogDescription>This action records your electronic signature for the current contract version.</DialogDescription>
        </DialogHeader>
        <ContractTermsSummary contract={contract} />
        <label className="flex items-start gap-3 rounded-control border border-brass/40 bg-brass/5 p-3 text-sm text-slate">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 accent-brass" />
          <span>I agree to these contract terms and authorize NexusWork to record my electronic signature.</span>
        </label>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!confirmed} loading={loading} onClick={onConfirm}>Sign contract</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function MilestoneStatusDot({ status }) {
  const color = {
    [MILESTONE_STATUS.NOT_FUNDED]: "bg-slate-300",
    [MILESTONE_STATUS.FUNDED]: "bg-blue-400",
    [MILESTONE_STATUS.IN_PROGRESS]: "bg-blue-400",
    [MILESTONE_STATUS.SUBMITTED]: "bg-amber-500",
    [MILESTONE_STATUS.DELIVERED]: "bg-amber-500",
    [MILESTONE_STATUS.REVISION_REQUESTED]: "bg-brass",
    [MILESTONE_STATUS.APPROVED]: "bg-escrow",
    [MILESTONE_STATUS.RELEASED]: "bg-escrow",
    [MILESTONE_STATUS.DISPUTED]: "bg-brick",
  };
  return <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${color[status] || "bg-slate-400"}`} />;
}

function SubmissionFiles({ submission, token, filesOverride }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const files = filesOverride || submission?.file_ids || [];
  const legacyUrls = submission?.file_urls || (submission?.file_url ? [submission.file_url] : []);

  const resolveLegacyUrl = (value) => {
    try {
      const parsed = new URL(value, window.location.origin);
      const match = parsed.pathname.match(/^\/v1\/files\/content\/([^/]+)$/);
      if (match) return getFileContentUrl(match[1], { direct: true });
    } catch {
      // Keep non-NexusWork legacy URLs unchanged.
    }
    return value;
  };

  if (!files.length && !legacyUrls.length) {
    return <p className="text-xs text-slate-300">No files attached to this submission.</p>;
  }

  const openPreview = (file) => {
    const mimetype = String(file.mimetype || "").toLowerCase();
    if (mimetype.includes("zip") || mimetype.includes("compressed") || mimetype.includes("x-7z") || mimetype.includes("rar")) {
      toast.info("This archive can be downloaded but cannot be previewed in the browser.");
      return;
    }
    setPreviewFile(file);
    setPreviewUrl(getFileContentUrl(file._id, { direct: true }));
  };

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file._id}
          className="flex w-full items-center gap-3 rounded-control border border-ink-300 bg-ink-50 p-2.5 text-left transition hover:border-brass/40"
        >
          <FileText className="h-4 w-4 shrink-0 text-brass" />
          <span className="min-w-0 flex-1 truncate text-sm text-slate">{file.original_name}</span>
          <span className="shrink-0 text-xs text-slate-300">{formatBytes(file.size)}</span>
          <button type="button" onClick={() => {
            try {
              openPreview(file);
            } catch (error) {
              toast.error(error.message || "Could not preview file");
            }
          }} className="shrink-0 text-xs font-semibold text-brass hover:underline">
            {String(file.mimetype || "").startsWith("video/") ? "Watch" : "Preview"}
          </button>
          <button type="button" onClick={async () => {
            try {
              await downloadFile(file._id, token, file.original_name);
            } catch (error) {
              toast.error(error.message || "Could not download file");
            }
          }} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brass hover:underline"><Download className="h-4 w-4" />Download</button>
        </div>
      ))}
      {legacyUrls.map((url, index) => (
        <a
          key={`${url}-${index}`}
          href={resolveLegacyUrl(url)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm text-brass hover:underline"
        >
          <Paperclip className="h-4 w-4" /> Legacy deliverable {index + 1}
        </a>
      ))}
      {previewUrl && (
        <div className="overflow-hidden rounded-card border border-ink-300 bg-white">
          {String(previewFile?.mimetype || "").startsWith("video/") ? (
            <video title="Milestone video deliverable" src={previewUrl} controls playsInline className="max-h-[min(65vh,720px)] w-full" />
          ) : String(previewFile?.mimetype || "").startsWith("image/") ? (
            <img alt={previewFile?.original_name || "Milestone deliverable"} src={previewUrl} className="max-h-[min(65vh,720px)] w-full object-contain" />
          ) : (
            <iframe title="Milestone deliverable preview" src={previewUrl} className="h-[min(65vh,720px)] w-full" />
          )}
        </div>
      )}
    </div>
  );
}

function SubmitWorkDialog({ milestone, token, onSubmitted, isRevision }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const requirements = milestone.deliverables || [];
  const [filesByKey, setFilesByKey] = useState({ general: [] });
  const [linksByKey, setLinksByKey] = useState({});
  const [linkDraftsByKey, setLinkDraftsByKey] = useState({});
  const [activeDeliverable, setActiveDeliverable] = useState("general");
  const inputRef = useRef(null);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const uploaded = [];
      try {
        const deliverableItems = [];
        for (const [key, selectedFiles] of Object.entries(filesByKey)) {
          const itemFiles = [];
          for (const file of selectedFiles) {
            const response = await uploadFile(file, { relatedType: "other", token });
            uploaded.push(response.data);
            itemFiles.push(response.data._id);
          }
          if (key !== "general") deliverableItems.push({ key, file_ids: itemFiles, links: linksByKey[key] || [] });
        }

        return submitMilestoneWork(
          milestone._id,
          {
            note: note.trim(),
            file_ids: uploaded.map((file) => file._id),
            deliverable_items: deliverableItems,
          },
          token
        );
      } catch (error) {
        await Promise.allSettled(uploaded.map((file) => deleteFile(file._id, token)));
        throw error;
      }
    },
    onSuccess: () => {
      setOpen(false);
      setNote("");
      setFilesByKey({ general: [] });
      setLinksByKey({});
      setLinkDraftsByKey({});
      onSubmitted();
      toast.success(isRevision ? "Revision submitted — waiting for client review." : "Work submitted — waiting for client review.");
    },
    onError: (error) => toast.error(error.message || "Could not submit work"),
  });

  const addFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    const selectedCount = Object.values(filesByKey).reduce((total, items) => total + items.length, 0);
    if (selectedCount + selected.length > 10) {
      toast.error("You can attach up to 10 files per submission.");
      return;
    }
    const valid = selected.filter((file) => { const message = validContractFile(file); if (message) { toast.error(`${file.name}: ${message}`); reportValidation(message, { form: "deliverable-upload", file: file.name }); return false; } return true; });
    setFilesByKey((current) => ({ ...current, [activeDeliverable]: [...(current[activeDeliverable] || []), ...valid] }));
    event.target.value = "";
  };

  const removeFile = (key, index) => setFilesByKey((current) => ({
    ...current,
    [key]: (current[key] || []).filter((_, i) => i !== index),
  }));

  const addLink = (key) => {
    const value = String(linkDraftsByKey[key] || "").trim();
    try {
      const parsed = new URL(value);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only HTTP and HTTPS links are allowed");
      if ((linksByKey[key] || []).length >= 5) throw new Error("Up to 5 links are allowed per deliverable");
      setLinksByKey((current) => ({ ...current, [key]: [...(current[key] || []), value] }));
      setLinkDraftsByKey((current) => ({ ...current, [key]: "" }));
    } catch (error) {
      toast.error(error.message || "Enter a valid web URL");
    }
  };

  const removeLink = (key, index) => setLinksByKey((current) => ({
    ...current,
    [key]: (current[key] || []).filter((_, i) => i !== index),
  }));

  const submit = () => {
    if (note.trim().length < 10) {
      toast.error("Please describe what you delivered in at least 10 characters.");
      return;
    }
    const missing = requirements.find((requirement) => requirement.required && !(filesByKey[requirement.key] || []).length && !(linksByKey[requirement.key] || []).length);
    if (missing) {
      toast.error(`Attach evidence for required deliverable: ${missing.title}`);
      return;
    }
    submitMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Upload className="h-4 w-4" /> {isRevision ? "Submit revision" : "Submit work"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isRevision ? "Submit a revision" : "Submit work"} — {milestone.title}</DialogTitle>
          <DialogDescription>
            Give the client a clear description of what changed or was delivered and attach the actual deliverables.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <label htmlFor={`submission-note-${milestone._id}`} className="text-sm font-medium text-slate">
              Delivery notes <span className="text-brass">*</span>
            </label>
            <Textarea
              id={`submission-note-${milestone._id}`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={6}
              maxLength={5000}
              className="mt-1"
              placeholder="Explain what you completed, what files contain, and how the client can verify the result…"
            />
            <p className="mt-1 text-xs text-slate-300">{note.length}/5000 characters</p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate">Deliverables</p>
              <p className="text-xs text-slate-300">Attach evidence to each required deliverable. Up to 10 files total.</p>
              </div>
              <input ref={inputRef} type="file" multiple className="hidden" onChange={addFiles} />
              <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                <Paperclip className="h-4 w-4" /> Add files
              </Button>
            </div>

            <div className="mt-3 space-y-2">
              {(requirements.length ? requirements : [{ key: "general", title: "Project files", description: "Attach the completed project files." }]).map((requirement) => (
                <div key={requirement.key} className="rounded-control border border-ink-300 bg-ink-50 p-3">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate">{requirement.title} {requirement.required !== false && <span className="text-brass">*</span>}</p>
                      <p className="text-xs text-slate-300">{requirement.description}</p>
                    </div>
                    <Button type="button" size="sm" variant="ghost" onClick={() => { setActiveDeliverable(requirement.key); inputRef.current?.click(); }}>Attach</Button>
                  </div>
                  {(filesByKey[requirement.key] || []).map((file, index) => (
                    <div key={`${file.name}-${index}`} className="mt-2 flex items-center gap-3 rounded-control border border-ink-300 bg-white p-2">
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate">{file.name}</span>
                      <span className="text-xs text-slate-300">{formatBytes(file.size)}</span>
                      <button type="button" onClick={() => removeFile(requirement.key, index)} className="text-slate-300 hover:text-slate" aria-label={`Remove ${file.name}`}><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <div className="mt-3 flex gap-2">
                    <Input
                      aria-label={`${requirement.title} live URL`}
                      value={linkDraftsByKey[requirement.key] || ""}
                      onChange={(event) => setLinkDraftsByKey((current) => ({ ...current, [requirement.key]: event.target.value }))}
                      placeholder="https://… (live demo, prototype, or hosted result)"
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={() => addLink(requirement.key)}>Add URL</Button>
                  </div>
                  {(linksByKey[requirement.key] || []).map((link, index) => (
                    <div key={`${link}-${index}`} className="mt-2 flex items-center gap-2 rounded-control border border-ink-300 bg-white p-2">
                      <ExternalLink className="h-4 w-4 shrink-0 text-brass" />
                      <a href={link} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs text-brass hover:underline">{link}</a>
                      <button type="button" onClick={() => removeLink(requirement.key, index)} className="text-slate-300 hover:text-slate" aria-label={`Remove ${link}`}><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              ))}
              {!Object.values(filesByKey).some((items) => items.length) && (
                <div className="rounded-card border border-dashed border-ink-300 p-6 text-center">
                  <Paperclip className="mx-auto h-6 w-6 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-300">No files selected yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" loading={submitMutation.isPending} onClick={submit}>
            {isRevision ? "Submit revision for review" : "Submit for client review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestRevisionDialog({ milestone, submission, token, onRequested }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const remaining = Math.max(Number(milestone.max_revisions ?? 3) - Number(milestone.revision_count ?? 0), 0);

  const mutation = useMutation({
    mutationFn: () => requestMilestoneRevision(submission?._id, { reason: reason.trim() }, token),
    onSuccess: () => {
      setOpen(false);
      setReason("");
      onRequested();
      toast.success("Revision requested. The student has been notified.");
    },
    onError: (error) => toast.error(error.message || "Could not request revision"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" disabled={!submission || remaining <= 0}>
          <RefreshCcw className="h-4 w-4" /> Request revision
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a revision</DialogTitle>
          <DialogDescription>
            Tell the student exactly what needs to change. {remaining} of {milestone.max_revisions ?? 3} revisions remaining.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={7}
          placeholder="Explain what is missing, incorrect, or needs improvement…"
        />
        <p className="text-xs text-slate-300">{reason.length}/2000 characters. Minimum 10 characters.</p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (reason.trim().length < 10) {
                toast.error("Revision feedback must be at least 10 characters.");
                return;
              }
              mutation.mutate();
            }}
            loading={mutation.isPending}
            disabled={remaining <= 0}
          >
            Send revision request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubmissionReviewDialog({ milestone, submissions, token, onChanged }) {
  const [open, setOpen] = useState(false);
  const latest = submissions.at(-1);
  const hasStructuredItems = Boolean(latest?.deliverable_items?.length);
  const missingRequirements = hasStructuredItems
    ? (milestone.deliverables || []).filter((requirement) => {
        if (!requirement.required) return false;
        const delivered = latest.deliverable_items.find((item) => item.key === requirement.key);
        return !delivered || (!delivered.file_ids?.length && !delivered.note);
      })
    : [];
  const assignedFileIds = new Set((latest?.deliverable_items || []).flatMap((item) => (item.file_ids || []).map((file) => String(file._id || file))));
  const canReview = latest && ["pending_review"].includes(latest.review_status);

  const approveMutation = useMutation({
    mutationFn: () => approveMilestone(milestone._id, token),
    onSuccess: (res) => {
      setOpen(false);
      onChanged();
      if (res?.data?.payout_pending) {
        toast.error(
          res?.data?.payout_message ||
            "Milestone approved, but the payout to the student failed. You can retry it from the milestone."
        );
      } else {
        toast.success("Milestone approved — escrow funds have been released.");
      }
    },
    onError: (error) => toast.error(error.message || "Could not approve milestone"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileText className="h-4 w-4" /> Review submission
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review {milestone.title}</DialogTitle>
          <DialogDescription>
            Review the latest version and every attached deliverable before releasing the milestone payment.
          </DialogDescription>
        </DialogHeader>

        {!latest ? (
          <p className="py-6 text-center text-sm text-slate-300">No submission is available.</p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-ink-300 bg-ink-50 p-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-300">Latest submission</p>
                <p className="mt-1 font-mono text-lg font-semibold text-slate">v{latest.version}</p>
              </div>
              <StatusBadge kind="milestone" status={milestone.status} showDot />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate">Student notes</p>
              <p className="mt-2 whitespace-pre-wrap rounded-card border border-ink-300 bg-ink-50 p-4 text-sm leading-relaxed text-slate-300">
                {latest.note || "No delivery note was provided."}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate">Deliverables</p>
              {missingRequirements.length > 0 && (
                <div className="mb-3 flex items-start gap-2 rounded-control border border-brick/40 bg-brick/5 p-3 text-sm text-slate">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brick" />
                  <span>Approval is blocked until the student provides: {missingRequirements.map((item) => item.title).join(", ")}.</span>
                </div>
              )}
              {milestone.deliverables?.length > 0 && (
                <div className="mb-3 space-y-2">
                  {milestone.deliverables.map((requirement) => {
                    const delivered = latest.deliverable_items?.find((item) => item.key === requirement.key);
                    const complete = Boolean(delivered?.file_ids?.length || delivered?.links?.length || delivered?.note);
                    return (
                      <div key={requirement.key} className="rounded-control border border-ink-300 bg-ink-50 p-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${complete ? "text-escrow" : "text-slate-300"}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate">{requirement.title}{requirement.required && <span className="text-brass"> *</span>}</p>
                            <p className="text-xs text-slate-300">{complete ? `${delivered?.file_ids?.length || 0} file(s), ${delivered?.links?.length || 0} link(s)` : "Not provided"}</p>
                            {delivered?.links?.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 truncate text-xs text-brass hover:underline"><ExternalLink className="h-3 w-3 shrink-0" />{link}</a>)}
                            {delivered?.note && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-300">{delivered.note}</p>}
                            <div className="mt-2">
                              <SubmissionFiles submission={{ ...latest, file_ids: delivered?.file_ids || [], file_urls: [] }} token={token} filesOverride={delivered?.file_ids || []} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <SubmissionFiles
                submission={latest}
                token={token}
                filesOverride={(latest.file_ids || []).filter((file) => !assignedFileIds.has(String(file._id || file)))}
              />
            </div>

            {latest.revision_reason && (
              <div className="rounded-card border border-brass/30 bg-brass/5 p-4">
                <p className="text-sm font-semibold text-brass">Previous revision feedback</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{latest.revision_reason}</p>
              </div>
            )}

            <Separator />
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate">
                <History className="h-4 w-4 text-brass" /> Submission history
              </p>
              <div className="space-y-2">
                {submissions.map((submission) => (
                  <div key={submission._id} className="rounded-control border border-ink-300 bg-ink-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-sm text-slate">v{submission.version}</span>
                      <Badge variant="outline">{submission.review_status.replaceAll("_", " ")}</Badge>
                    </div>
                    {submission.feedback && (
                      <p className="mt-2 text-xs text-slate-300">Feedback: {submission.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          {canReview && (
            <Button disabled={missingRequirements.length > 0} loading={approveMutation.isPending} onClick={() => approveMutation.mutate()}>
              <CheckCircle2 className="h-4 w-4" /> Approve &amp; release
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MilestoneCard({ milestone, role, token, onAction, fundingMilestoneId, onChanged }) {
  const queryClient = useQueryClient();
  const submissionsQuery = useQuery({
    queryKey: ["submissions", milestone._id],
    queryFn: () => listMilestoneSubmissions(milestone._id, token),
    enabled: !!token,
  });
  const submissions = submissionsQuery.data?.data ?? [];
  const latestSubmission = submissions.at(-1);
  const portfolioConsentQuery = useQuery({
    queryKey: ["portfolio-consent", milestone._id],
    queryFn: () => getMilestonePortfolioConsent(milestone._id, token),
    enabled: role === ROLES.CLIENT && milestone.status === MILESTONE_STATUS.RELEASED,
  });
  const portfolioConsent = portfolioConsentQuery.data?.data;
  const canFund = role === ROLES.CLIENT && milestone.status === MILESTONE_STATUS.NOT_FUNDED;
  const canContinueFunding = role === ROLES.CLIENT && milestone.status === MILESTONE_STATUS.FUNDING_PENDING;
  const canStart = role === ROLES.STUDENT && [MILESTONE_STATUS.FUNDED, MILESTONE_STATUS.REVISION_REQUESTED].includes(milestone.status);
  const canSubmit = role === ROLES.STUDENT && [MILESTONE_STATUS.FUNDED, MILESTONE_STATUS.IN_PROGRESS, MILESTONE_STATUS.REVISION_REQUESTED].includes(milestone.status);
  const canApprove = role === ROLES.CLIENT && REVIEWABLE_STATUSES.includes(milestone.status) && latestSubmission?.review_status === "pending_review";
  const canRevision = role === ROLES.CLIENT && REVIEWABLE_STATUSES.includes(milestone.status) && latestSubmission?.review_status === "pending_review";
  const canDispute = DISPUTABLE_STATUSES.includes(milestone.status);
  const isStartingFunding = fundingMilestoneId === milestone._id;
  const isWorking = milestone.status === MILESTONE_STATUS.IN_PROGRESS;

  // The client approved this milestone and escrow release was attempted, but the
  // transfer to the student's Stripe account failed (bad/unverified payout account,
  // Stripe error, etc). The milestone stays in "approved" — not "released" — with
  // payout_status "pending" and a reason. Without this check the UI just shows a
  // plain "Approved" badge and the student's wallet silently stays at $0.
  const hasPayoutFailure =
    [MILESTONE_STATUS.APPROVED, "release_pending", "release_failed"].includes(milestone.status) &&
    milestone.payout_status !== "paid";

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["milestones"] });
    queryClient.invalidateQueries({ queryKey: ["submissions", milestone._id] });
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
    queryClient.invalidateQueries({ queryKey: ["wallet-tx"] });
    onChanged?.();
  };

  const startMutation = useMutation({
    mutationFn: () => startMilestoneWork(milestone._id, token),
    onSuccess: refresh,
    onError: (error) => toast.error(error.message || "Could not start work"),
  });

  const retryReleaseMutation = useMutation({
    mutationFn: () => retryMilestoneRelease(milestone._id, token),
    onSuccess: (res) => {
      refresh();
      if (res?.data?.payout_pending) {
        toast.error(res?.data?.payout_message || "Payout still could not be released.");
      } else {
        toast.success("Payout released to the student.");
      }
    },
    onError: (error) => toast.error(error.message || "Could not retry the payout"),
  });

  const portfolioConsentMutation = useMutation({
    mutationFn: (decision) => respondToMilestonePortfolioConsent(portfolioConsent._id, decision, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-consent", milestone._id] });
      toast.success("Portfolio consent updated.");
    },
    onError: (error) => toast.error(error.message || "Could not update portfolio consent"),
  });

  return (
    <Card className="animate-fade-up">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <MilestoneStatusDot status={milestone.status} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold text-slate">{milestone.title}</p>
                <Badge variant="outline">#{milestone.sequence}</Badge>
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-300">
                <Clock className="h-3 w-3" /> Due {formatDate(milestone.due_date)}
              </p>
              {milestone.description && <p className="mt-2 max-w-2xl text-sm text-slate-300">{milestone.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-semibold text-brass">{formatCurrency(milestone.amount, milestone.currency || "USD")}</span>
            <StatusBadge kind="milestone" status={milestone.status} showDot />
          </div>
        </div>

        {hasPayoutFailure && (
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-card border border-brick/30 bg-brick/5 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brick" />
              <div>
                <p className="text-sm font-semibold text-brick">Payout could not be released</p>
                {role === ROLES.CLIENT ? (
                  <p className="mt-1 text-sm text-slate-300">
                    {milestone.payout_failure_reason ||
                      "The escrow funds were approved but the transfer to the student's payout account failed."}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-slate-300">
                    Your work was approved, but the payout is still being processed. You have not been charged or paid twice.
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-300">
                  {role === ROLES.CLIENT
                    ? "The client's approval was recorded, but the student has not been paid yet."
                    : "The client’s approval was recorded. The payout will appear in your wallet after it succeeds."}
                </p>
              </div>
            </div>
            {role === ROLES.CLIENT && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => retryReleaseMutation.mutate()}
                loading={retryReleaseMutation.isPending}
              >
                <RefreshCcw className="h-4 w-4" /> Retry payout
              </Button>
            )}
          </div>
        )}

        {latestSubmission && (
          <div className="mt-4 rounded-card border border-ink-300 bg-ink-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brass" />
                <p className="text-sm font-semibold text-slate">Submission v{latestSubmission.version}</p>
              </div>
              <Badge variant="outline">{latestSubmission.review_status.replaceAll("_", " ")}</Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-slate-300">{latestSubmission.note || "No delivery note."}</p>
            {latestSubmission.revision_reason && milestone.status === MILESTONE_STATUS.REVISION_REQUESTED && (
              <div className="mt-3 rounded-control border border-brass/30 bg-brass/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-brass">Revision requested</p>
                <p className="mt-1 text-sm text-slate-300">{latestSubmission.revision_reason}</p>
                <p className="mt-2 text-xs text-slate-300">
                  {Math.max(Number(milestone.max_revisions ?? 3) - Number(milestone.revision_count ?? 0), 0)} revisions remaining
                </p>
              </div>
            )}
          </div>
        )}

        {role === ROLES.CLIENT && milestone.status === MILESTONE_STATUS.RELEASED && portfolioConsent && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-brass/30 bg-brass/5 p-4">
            <div>
              <p className="text-sm font-semibold text-slate">Portfolio permission</p>
              <p className="mt-1 text-xs text-slate-300">
                {portfolioConsent.consent_status === "pending"
                  ? "Allow the student to showcase this released work publicly."
                  : `You ${portfolioConsent.consent_status} publication of this work.`}
              </p>
            </div>
            {portfolioConsent.consent_status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => portfolioConsentMutation.mutate("denied")} loading={portfolioConsentMutation.isPending}>Keep private</Button>
                <Button size="sm" onClick={() => portfolioConsentMutation.mutate("approved")} loading={portfolioConsentMutation.isPending}>Allow publication</Button>
              </div>
            )}
          </div>
        )}

        {(canFund || canContinueFunding || canStart || canSubmit || canApprove || canRevision || canDispute) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-300 pt-3">
            {canFund && (
              <Button size="sm" onClick={() => onAction("fund", milestone)} disabled={isStartingFunding}>
                {isStartingFunding ? "Preparing payment…" : "Fund milestone"}
              </Button>
            )}
            {canContinueFunding && (
              <Button size="sm" variant="outline" onClick={() => onAction("fund", milestone)} disabled={isStartingFunding}>
                {isStartingFunding ? "Opening payment…" : "Continue payment"}
              </Button>
            )}
            {canStart && !isWorking && (
              <Button size="sm" variant="secondary" onClick={() => startMutation.mutate()} loading={startMutation.isPending}>
                Start work
              </Button>
            )}
            {canSubmit && (
              <SubmitWorkDialog
                milestone={milestone}
                token={token}
                onSubmitted={refresh}
                isRevision={milestone.status === MILESTONE_STATUS.REVISION_REQUESTED}
              />
            )}
            {role === ROLES.CLIENT && (canApprove || canRevision) && (
              <SubmissionReviewDialog
                milestone={milestone}
                submissions={submissions}
                token={token}
                onChanged={refresh}
              />
            )}
            {canRevision && (
              <RequestRevisionDialog
                milestone={milestone}
                submission={latestSubmission}
                token={token}
                onRequested={refresh}
              />
            )}
            {canDispute && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="text-brick">
                    <Flag className="h-3.5 w-3.5" /> Raise dispute
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Raise a dispute</DialogTitle>
                    <DialogDescription>Describe the issue with this milestone. Both parties and NexusWork will review it.</DialogDescription>
                  </DialogHeader>
                  <Textarea id={`dispute-reason-${milestone._id}`} maxLength={2000} placeholder="What went wrong? Be specific so we can help resolve it…" rows={6} />
                  <DialogFooter>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const reason = document.getElementById(`dispute-reason-${milestone._id}`)?.value.trim() || "";
                        if (reason.length < 10 || reason.length > 2000) { const message = "Dispute reason must be between 10 and 2,000 characters."; toast.error(message); reportValidation(message, { form: "dispute" }); return; }
                        onAction("dispute", milestone, { reason });
                      }}
                    >
                      Open dispute
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChatPanel({ contractId, token, contract }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const fileInputRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", contractId],
    queryFn: () => listMessages(contractId, token),
  });

  const messages = data?.data?.messages ?? [];
  const contractTitle = contract?.project_id?.title || "Contract";

  const uploadAttachment = useMutation({
    mutationFn: (file) => uploadFile(file, { relatedType: "message_attachment", token }),
    onSuccess: (res) => setPendingAttachment(res.data),
    onError: (err) => toast.error(err.message || "That file couldn't be uploaded"),
  });

  const sendMutation = useMutation({
    mutationFn: () => sendMessage(contractId, { body: message.trim(), attachments: pendingAttachment ? [pendingAttachment._id] : [] }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", contractId] });
      setMessage("");
      setPendingAttachment(null);
    },
    onError: (err) => toast.error(err.message || "That message couldn't be sent"),
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-ink-300 pb-3">
        <MessageSquare className="h-4 w-4 text-brass" />
        <p className="text-sm font-semibold text-slate">Contract chat</p>
        <Badge variant="outline" className="ml-auto">{contractTitle}</Badge>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto py-4 pr-1" aria-live="polite">
        {isLoading && <Skeleton className="h-20 w-2/3" />}
        {!isLoading && messages.length === 0 && <p className="py-10 text-center text-sm text-slate-300">No messages yet. Use chat to coordinate the milestone.</p>}
        {messages.map((item) => (
          <div key={item._id} className="rounded-card border border-ink-300 bg-ink-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate">{item.sender_id?.name || "Participant"}</p>
              <span className="text-[11px] text-slate-300">{formatDate(item.createdAt)}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{item.body}</p>
          </div>
        ))}
      </div>
      {pendingAttachment && (
        <div className="mb-2 flex items-center gap-2 rounded-control border border-ink-300 bg-ink-700 px-3 py-1.5 text-xs text-slate-300">
          <Paperclip className="h-3.5 w-3.5 text-brass" />
          <span className="flex-1 truncate">{pendingAttachment.original_name}</span>
          <button type="button" onClick={() => setPendingAttachment(null)} aria-label="Remove attachment"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
      <form
        className="flex gap-2 border-t border-ink-300 pt-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!message.trim() && !pendingAttachment) return;
          sendMutation.mutate();
        }}
      >
        <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadAttachment.mutate(file); event.target.value = ""; }} />
        <Button type="button" variant="secondary" size="icon" aria-label="Attach file" disabled={uploadAttachment.isPending} onClick={() => fileInputRef.current?.click()}>
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type a message…" className="flex-1" />
        <Button type="submit" size="sm" loading={sendMutation.isPending}>Send</Button>
      </form>
    </div>
  );
}

export default function ContractDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { token, user } = useAuth();

  const queryClient = useQueryClient();
  const [fundingMilestone, setFundingMilestone] = useState(null);
  const [paymentChoiceMilestone, setPaymentChoiceMilestone] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [createMilestoneOpen, setCreateMilestoneOpen] = useState(false);
  const fileExchangeInputRef = useRef(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["contract", id],
    queryFn: () => getContract(id, token),
    enabled: !!token,
  });

  const milestonesQuery = useQuery({
    queryKey: ["milestones", id],
    queryFn: () => listContractMilestones(id, token),
    enabled: !!token,
  });
  const meetingsQuery = useQuery({
    queryKey: ["meetings", id],
    queryFn: () => listContractMeetings(id, token),
    enabled: !!token,
  });

  const contract = data?.data;
  const milestones = milestonesQuery.data?.data?.milestones ?? [];
  const currentUserId = user?._id ?? user?.id;
  const clientId = contract?.client_id?._id ?? contract?.client_id;
  const studentId = contract?.student_id?._id ?? contract?.student_id;
  const isClient = Boolean(contract && currentUserId && String(clientId) === String(currentUserId));
  const isStudent = Boolean(contract && currentUserId && String(studentId) === String(currentUserId));
  const role = isClient ? ROLES.CLIENT : isStudent ? ROLES.STUDENT : user?.role;
  const meetings = meetingsQuery.data?.data ?? [];
  const myReview = isClient ? contract?.client_review : contract?.student_review;
  const myReviewIsCurrent = Boolean(
    myReview?.reviewed_at &&
    myReview.contract_version === contract?.version &&
    myReview.terms_fingerprint === contract?.terms_fingerprint
  );
  const mySignature = isClient ? contract?.client_signature : contract?.student_signature;
  const hasSigned = Boolean(mySignature?.signed_at);

  const agreedAmount = Number(contract?.terms?.total_amount ?? 0);
  const milestoneTotal = milestones.reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0);
  const totalAmount = agreedAmount > 0 ? agreedAmount : milestoneTotal;
  const contractCurrency = contract?.terms?.currency || "USD";
  const releasedAmount = milestones
    .filter((m) => m.status === MILESTONE_STATUS.RELEASED)
    .reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0);
  const allocatedAmount = milestones
    .filter((m) => [MILESTONE_STATUS.FUNDED, MILESTONE_STATUS.IN_PROGRESS, MILESTONE_STATUS.SUBMITTED, MILESTONE_STATUS.DELIVERED, MILESTONE_STATUS.APPROVED, MILESTONE_STATUS.RELEASED, MILESTONE_STATUS.DISPUTED].includes(m.status))
    .reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0);
  const completedMilestones = milestones.filter((m) => m.status === MILESTONE_STATUS.RELEASED).length;
  const milestoneProgress = useMemo(() => {
    if (!totalAmount) return 0;
    return Math.min(100, Math.round((releasedAmount / totalAmount) * 100));
  }, [releasedAmount, totalAmount]);

  const createMilestoneMutation = useMutation({
    mutationFn: (payload) => createMilestone(id, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", id] });
      setCreateMilestoneOpen(false);
      toast.success("Milestone created. Fund it to place the amount in escrow.");
    },
    onError: (error) => toast.error(error.message || "Could not create milestone"),
  });

  const signMutation = useMutation({
    mutationFn: () => signContract(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      setSignDialogOpen(false);
      toast.success("Contract signed successfully.");
    },
    onError: (error) => toast.error(error.message || "Could not sign contract"),
  });

  const reviewMutation = useMutation({
    mutationFn: () => reviewContract(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      setReviewDialogOpen(false);
      toast.success("Contract reviewed successfully.");
    },
    onError: (error) => toast.error(error.message || "Could not review contract"),
  });

  const fundMutation = useMutation({
    mutationFn: ({ milestoneId, provider }) => fundMilestone(milestoneId, token, provider),
    onSuccess: (response, { milestone }) => setFundingMilestone({
      milestone,
      clientSecret: response.data.client_secret,
      paymentIntentId: response.data.payment_intent_id,
      provider: response.data.provider,
    }),
    onError: (error) => toast.error(error.message || "Could not start funding"),
  });

  const approveMutation = useMutation({
    mutationFn: ({ milestoneId }) => approveMilestone(milestoneId, token),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["milestones", id] });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      if (response?.data?.payout_pending) {
        toast.error(response.data.payout_message || "Milestone approved, but payout is pending. Complete the student's payout setup and retry.");
      } else {
        toast.success("Milestone approved — escrow funds have been released.");
      }
    },
    onError: (error) => toast.error(error.message || "Could not approve milestone"),
  });

  const disputeMutation = useMutation({
    mutationFn: ({ milestoneId, reason }) => openDispute(milestoneId, { reason }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", id] });
      toast.success("Dispute opened — our team will review it.");
    },
    onError: (error) => toast.error(error.message || "Could not open dispute"),
  });

  const shareFileMutation = useMutation({
    mutationFn: async (file) => {
      const uploaded = await uploadFile(file, { relatedType: "message_attachment", token });
      await sendMessage(id, {
        body: `📎 Shared a file: ${uploaded.data.original_name}`,
        attachments: [uploaded.data._id],
      }, token);
      return uploaded;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
      toast.success(`${response.data.original_name} shared in contract chat.`);
    },
    onError: (error) => toast.error(error.message || "That file couldn't be shared"),
  });

  function refreshMilestones() {
    queryClient.invalidateQueries({ queryKey: ["milestones", id] });
    queryClient.invalidateQueries({ queryKey: ["submissions"] });
  }

  function handleAction(action, milestone, payload = {}) {
    if (action === "fund") {
      setPaymentChoiceMilestone(milestone);
      return;
    }
    if (action === "approve") {
      approveMutation.mutate({ milestoneId: milestone._id });
      return;
    }
    if (action === "dispute") {
      if (!payload.reason || payload.reason.trim().length < 10) {
        toast.error("Please describe the issue in at least 10 characters.");
        return;
      }
      disputeMutation.mutate({ milestoneId: milestone._id, reason: payload.reason.trim() });
    }
  }

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-28 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>;
  }

  if (error || !contract) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <h1 className="font-display text-xl text-slate">Contract couldn't be loaded</h1>
        <p className="mt-2 text-sm text-slate-300">{error?.message || "Contract not found"}</p>
        <Link to="/contracts" className="mt-6 inline-block"><Button variant="secondary">Back to contracts</Button></Link>
      </Card>
    );
  }

  const partnerName = isClient ? contract?.student_id?.name : contract?.client_id?.name;
  const partnerId = isClient ? studentId : clientId;

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/contracts" className="inline-flex items-center gap-1.5 text-sm text-slate-300 transition-colors hover:text-brass">
        <ArrowLeft className="h-4 w-4" /> All contracts
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Contract · {contract?.project_id?.category || "Project"}</p>
          <h1 className="mt-1 font-display text-2xl leading-tight tracking-tight text-slate">{contract?.project_id?.title || "Contract"}</h1>
          <p className="mt-1 text-sm text-slate-300">With {partnerName || "Partner"} · {formatDate(contract?.createdAt)}</p>
        </div>
        <StatusBadge kind="contract" status={contract?.status} showDot />
      </div>

      {contract?.status === "active" && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between gap-3"><div><CardTitle className="text-lg">Video meetings</CardTitle><p className="mt-1 text-sm text-slate-300">Schedule a secure call with your contract partner.</p></div><MeetingCreateDialog contractId={id} token={token} onCreated={() => queryClient.invalidateQueries({ queryKey: ["meetings", id] })} /></CardHeader>
          <CardContent className="space-y-2">{meetings.length ? meetings.map((meeting) => <div key={meeting._id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-ink-300 bg-ink-50 p-3"><div><p className="font-semibold text-slate">{meeting.title}</p><p className="text-xs text-slate-300">{formatDate(meeting.scheduled_start)} · {meeting.status}</p></div><Link to={`/meetings/${meeting._id}`}><Button size="sm">{meeting.status === "ended" ? "View" : "Join"}</Button></Link></div>) : <p className="text-sm text-slate-300">No meetings scheduled yet.</p>}</CardContent>
        </Card>
      )}

      {contract?.status === "pending_review" && (
        <Card className="mt-6 border-brass/30 bg-brass/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-brass" />
              <div>
                <p className="font-semibold text-slate">{myReviewIsCurrent ? "Review recorded" : "Contract ready for review"}</p>
                <p className="text-sm text-slate-300">{myReviewIsCurrent ? "Waiting for the other party to review the agreed terms." : "Review the agreed terms before signing and starting work."}</p>
              </div>
            </div>
            {!myReviewIsCurrent && <Button onClick={() => setReviewDialogOpen(true)}>Review &amp; agree</Button>}
          </CardContent>
        </Card>
      )}

      {contract?.status === "pending_signature" && (
        <Card className="mt-6 border-brass/30 bg-brass/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-brass" />
              <div>
                <p className="font-semibold text-slate">Ready for signature</p>
                <p className="text-sm text-slate-300">Both parties have reviewed the contract. Sign it to activate the workspace.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!myReviewIsCurrent && (
                <Button variant="secondary" onClick={() => setReviewDialogOpen(true)}>
                  Review current terms
                </Button>
              )}
              {hasSigned ? <Button disabled>Signature recorded</Button> : <Button onClick={() => setSignDialogOpen(true)}>Sign contract</Button>}
            </div>
          </CardContent>
        </Card>
      )}

      {contract?.status === "completed" && (
        <Card className="mt-6 border-escrow/30 bg-escrow-100/40">
          <CardContent className="flex flex-wrap items-center gap-3 p-5">
            <CheckCircle2 className="h-5 w-5 text-escrow" />
            <div>
              <p className="font-semibold text-slate">Contract completed</p>
              <p className="text-sm text-slate-300">All milestones have been delivered and paid out. Consider leaving {partnerName || "your collaborator"} a review below.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Milestones</CardTitle>
              <div className="flex items-center gap-3">
                <div className="text-right text-xs text-slate-300">
                  <p><span className="text-slate-400">Released:</span> <span className="font-mono text-escrow">{formatCurrency(releasedAmount, contractCurrency)} / {formatCurrency(totalAmount, contractCurrency)}</span></p>
                  <p className="mt-0.5"><span className="text-slate-400">Allocated:</span> <span className="font-mono">{formatCurrency(allocatedAmount, contractCurrency)}</span></p>
                </div>
                <Badge variant="secondary">{milestoneProgress}% released</Badge>
                <span className="whitespace-nowrap text-xs text-slate-300">{completedMilestones} / {milestones.length} milestones</span>
                {isClient && contract.status === "active" && (
                  <Dialog open={createMilestoneOpen} onOpenChange={setCreateMilestoneOpen}>
                    <DialogTrigger asChild><Button size="sm">+ Create milestone</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create milestone</DialogTitle>
                        <DialogDescription>Define a funded unit of work from the agreed {formatCurrency(totalAmount, contractCurrency)} contract amount.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={(event) => {
                        event.preventDefault();
                        const form = event.currentTarget;
                        const amount = Number(form.elements.amount.value);
                        const title = form.elements.title.value.trim();
                        const dueDate = form.elements.due_date.value;
                        const description = form.elements.description.value.trim();
                        const maxRevisions = Number(form.elements.max_revisions.value);
                        const existing = milestones.reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0);
                        if (!title || !amount || amount <= 0 || !dueDate) { toast.error("Title, amount and due date are required."); return; }
                        if (existing + amount > totalAmount) { toast.error(`Milestones cannot exceed the agreed amount. Remaining: ${formatCurrency(totalAmount - existing, contractCurrency)}`); return; }
                        createMilestoneMutation.mutate({ title, amount, due_date: dueDate, description, max_revisions: maxRevisions });
                      }}>
                        <div className="space-y-4">
                          <div><label className="text-sm font-medium text-slate">Title</label><Input name="title" className="mt-1" placeholder="Research methodology" required /></div>
                          <div><label className="text-sm font-medium text-slate">Amount</label><Input name="amount" className="mt-1" type="number" min="0.01" step="0.01" required /></div>
                          <div><label className="text-sm font-medium text-slate">Due date</label><Input name="due_date" className="mt-1" type="date" required /></div>
                          <div><label className="text-sm font-medium text-slate">Maximum revisions</label><Input name="max_revisions" className="mt-1" type="number" min="0" max="20" defaultValue="3" required /></div>
                          <div><label className="text-sm font-medium text-slate">Description</label><Textarea name="description" className="mt-1" rows={4} placeholder="Describe the expected deliverable…" /></div>
                        </div>
                        <DialogFooter className="mt-5"><Button type="button" variant="ghost" onClick={() => setCreateMilestoneOpen(false)}>Cancel</Button><Button type="submit" loading={createMilestoneMutation.isPending}>Create milestone</Button></DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={milestoneProgress} className="mb-5 bg-ink-300" />
              <div className="space-y-3">
                {milestonesQuery.isLoading && <><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></>}
                {!milestonesQuery.isLoading && milestones.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-300">{isClient ? "Create the first milestone above, then fund it to place money in escrow." : "Waiting for the client to create the first milestone."}</p>
                )}
                {milestones.map((milestone) => (
                  <MilestoneCard
                    key={milestone._id}
                    milestone={milestone}
                    role={role}
                    token={token}
                    onAction={handleAction}
                    fundingMilestoneId={fundMutation.isPending ? fundMutation.variables?.milestoneId : undefined}
                    onChanged={refreshMilestones}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Submission history</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <SubmissionHistoryItem key={milestone._id} milestone={milestone} token={token} />
                ))}
                {!milestones.length && <p className="py-6 text-center text-sm text-slate-300">Nothing submitted yet.</p>}
              </div>
            </CardContent>
          </Card>

          {contract?.status === "completed" && partnerId && (
            <ReviewsSection userId={partnerId} contractId={id} showForm />
          )}

          <Card>
            <CardHeader><CardTitle className="text-lg">File exchange</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <input ref={fileExchangeInputRef} type="file" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; const message = validContractFile(file); if (file && !message) shareFileMutation.mutate(file); else if (message) { toast.error(message); reportValidation(message, { form: "file-exchange" }); } event.target.value = ""; }} />
                <Button variant="secondary" size="sm" disabled={shareFileMutation.isPending} onClick={() => fileExchangeInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4" /> {shareFileMutation.isPending ? "Uploading…" : "Upload files"}
                </Button>
                <p className="text-xs text-slate-300">Use milestone submission upload for deliverables that should be reviewed and versioned.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Contract details</p>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-slate-300">Status</dt><dd><StatusBadge kind="contract" status={contract.status} showDot /></dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-300">Client</dt><dd className="truncate font-semibold text-slate">{contract.client_id?.name || "—"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-300">Student</dt><dd className="truncate font-semibold text-slate">{contract.student_id?.name || "—"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-300">Agreed amount</dt><dd className="font-mono text-brass">{formatCurrency(totalAmount, contractCurrency)}</dd></div>
              </dl>
              <Separator className="my-4" />
              <p className="text-xs leading-relaxed text-slate-300"><ShieldCheck className="mb-1 mr-1 inline h-3.5 w-3.5 text-brass" /> Funds are held in escrow until each milestone is approved by the client.</p>
            </CardContent>
          </Card>
          <Card><CardContent className="h-[420px] p-4"><ChatPanel contractId={id} token={token} contract={contract} /></CardContent></Card>
        </aside>
      </div>

      <ContractReviewDialog
        contract={contract}
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        onConfirm={() => reviewMutation.mutate()}
        loading={reviewMutation.isPending}
      />
      <ContractSignDialog
        contract={contract}
        open={signDialogOpen}
        onOpenChange={setSignDialogOpen}
        onConfirm={() => signMutation.mutate()}
        loading={signMutation.isPending}
      />
      <Dialog open={Boolean(paymentChoiceMilestone)} onOpenChange={(next) => !next && setPaymentChoiceMilestone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose payment method</DialogTitle>
            <DialogDescription>
              Select how you want to fund this {formatCurrency(paymentChoiceMilestone?.amount || 0, paymentChoiceMilestone?.currency || contractCurrency)} milestone. The selected provider will be used for verification and escrow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="secondary"
              disabled={String(paymentChoiceMilestone?.currency || contractCurrency).toLowerCase() !== "usd"}
              onClick={() => {
                const milestone = paymentChoiceMilestone;
                setPaymentChoiceMilestone(null);
                fundMutation.mutate({ milestoneId: milestone._id, milestone, provider: "stripe" });
              }}
            >
              Pay with Stripe
            </Button>
            <Button
              variant="outline"
              disabled={String(paymentChoiceMilestone?.currency || contractCurrency).toLowerCase() !== "etb"}
              onClick={() => {
                const milestone = paymentChoiceMilestone;
                setPaymentChoiceMilestone(null);
                fundMutation.mutate({ milestoneId: milestone._id, milestone, provider: "chapa" });
              }}
            >
              Pay with Chapa
            </Button>
          </div>
          <p className="text-xs text-slate-300">Stripe supports USD milestones here; Chapa supports ETB milestones.</p>
        </DialogContent>
      </Dialog>
      <FundMilestoneDialog contractId={id} funding={fundingMilestone} token={token} onClose={() => { setFundingMilestone(null); refreshMilestones(); }} />
    </div>
  );
}

function SubmissionHistoryItem({ milestone, token }) {
  const { data, isLoading } = useQuery({
    queryKey: ["submissions", milestone._id],
    queryFn: () => listMilestoneSubmissions(milestone._id, token),
    enabled: !!token,
  });
  const submissions = data?.data ?? [];
  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (!submissions.length) return null;

  return (
    <div className="rounded-card border border-ink-300 bg-ink-700 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2"><History className="h-4 w-4 text-brass" /><p className="font-semibold text-slate">{milestone.title}</p></div>
        <StatusBadge kind="milestone" status={milestone.status} showDot />
      </div>
      <div className="mt-3 space-y-2">
        {submissions.map((submission) => (
          <div key={submission._id} className="rounded-control border border-ink-300 bg-ink-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-sm text-slate">v{submission.version}</span>
              <Badge variant="outline">{submission.review_status.replaceAll("_", " ")}</Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-slate-300">{submission.note || "No notes."}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
              <span>{formatDate(submission.submitted_at || submission.createdAt)}</span>
              <span>•</span>
              <span>{submission.file_ids?.length || 0} files</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
