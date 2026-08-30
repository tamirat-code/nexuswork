import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, GraduationCap, ShieldCheck, XCircle, FileText } from "lucide-react";
import { getVerifications, getVerificationStats, reviewVerification, getSkillCertificationQueue, reviewSkillCertificationRequest } from "../../services/api/verifications.api.js";
import { fetchFileBlob } from "../../services/api/files.api.js";
import { listUniversities, getMyUniversity } from "../../services/api/universities.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/shadcn/avatar.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/shadcn/tabs.jsx";
import { StatusBadge } from "../../components/ui/shadcn/status-badge.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/shadcn/dialog.jsx";
import { Textarea } from "../../components/ui/shadcn/textarea.jsx";
import { reportValidation } from "../../lib/validation.js";

async function openPrivateFile(file, token) {
  try {
    const blob = await fetchFileBlob(file._id, token);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    toast.error(error.message || "Could not open document");
  }
}

function RejectDialog({ open, onOpenChange, onConfirm, loading }) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject verification</DialogTitle>
          <DialogDescription>
            Let the student know why, so they can fix it and resubmit.
          </DialogDescription>
        </DialogHeader>
          <Textarea
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Uploaded document doesn't match the name on file"
          rows={3}
        />
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={loading}
            disabled={!reason.trim() || reason.trim().length < 3}
            onClick={() => {
              if (reason.trim().length < 3) { const message = "Give the student a rejection reason of at least 3 characters."; toast.error(message); reportValidation(message, { form: "verification-rejection" }); return; }
              onConfirm(reason.trim());
              setReason("");
            }}
          >
            Confirm rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VerificationQueue({ token }) {
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["verifications"],
    queryFn: () => getVerifications("?status=pending", token),
    enabled: !!token,
  });
  const review = useMutation({
    mutationFn: ({ id, decision, rejection_reason }) =>
      reviewVerification(id, { decision, rejection_reason }, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verifications"] });
      toast.success("Decision saved");
      setRejectTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });
  const items = data?.data ?? [];
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-sm text-brick">{error.message}</p>;
  if (!items.length) return (
    <Card className="p-10 text-center">
      <BadgeCheck className="mx-auto h-10 w-10 text-escrow" />
      <h3 className="mt-4 font-display text-lg text-slate">All caught up</h3>
      <p className="mt-2 text-sm text-slate-300">No pending verifications for this institution.</p>
    </Card>
  );
  return (
    <div className="space-y-4">
      {items.map((v) => (
        <Card key={v._id} className="animate-fade-up">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar><AvatarImage src={v.user_id?.avatarUrl} alt="" /><AvatarFallback>{(v.user_id?.name || "S").slice(0, 2)}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate">{v.user_id?.name || "Unknown student"}</p>
                  <p className="truncate text-xs text-slate-300">{v.user_id?.email || "—"}</p>
                  <Badge variant="secondary" className="mt-1"><GraduationCap className="h-3 w-3" /> {v.university_id?.name || "This institution"}</Badge>
                </div>
              </div>
              <StatusBadge kind="verification" status={v.status} showDot />
            </div>
            <div className="mt-4 space-y-2 rounded-control border border-ink-300 bg-ink-700 p-3 text-sm text-slate-300">
              <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                <p>
                  <span className="text-slate-300/70">Declared name:</span>{" "}
                  <span className="font-medium text-slate">{v.full_name || "—"}</span>
                </p>
                <p>
                  <span className="text-slate-300/70">Student ID number:</span>{" "}
                  <span className="font-mono">{v.student_id_number || "—"}</span>
                </p>
                <p className="sm:col-span-2">
                  <span className="text-slate-300/70">Program:</span> {v.program || "—"}
                </p>
              </div>
              <p className="flex flex-wrap items-center gap-2 pt-1">
                <ShieldCheck className="h-4 w-4 text-brass" /> Account email domain:{" "}
                <span className="font-mono">{v.email_domain || "—"}</span>
                {v.email_domain_matched ? (
                  <Badge variant="secondary">Matches institution domain</Badge>
                ) : (
                  <Badge variant="warning">Doesn't match — check the document instead</Badge>
                )}
              </p>
              <p className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brass" />
                {v.document_file_id?.url ? (
                  <button
                    type="button"
                    onClick={() => openPrivateFile(v.document_file_id, token)}
                    className="font-semibold text-brass underline-offset-2 hover:underline"
                  >
                    View uploaded document ({v.document_file_id.original_name || "file"})
                  </button>
                ) : (
                  <span className="font-medium text-brick">No document on file — do not approve without evidence</span>
                )}
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                loading={review.isPending}
                disabled={!v.document_file_id}
                title={!v.document_file_id ? "No document on file — reject or ask the student to resubmit with evidence" : undefined}
                onClick={() => review.mutate({ id: v._id, decision: "approved" })}
              >
                <BadgeCheck className="h-4 w-4" /> Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => setRejectTarget(v._id)}><XCircle className="h-4 w-4" /> Reject</Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <RejectDialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        loading={review.isPending}
        onConfirm={(reason) =>
          review.mutate({ id: rejectTarget, decision: "rejected", rejection_reason: reason || undefined })
        }
      />
    </div>
  );
}

function SkillCertificationQueue({ token }) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["skill-certification-queue"], queryFn: () => getSkillCertificationQueue("?status=pending", token), enabled: !!token });
  const review = useMutation({
    mutationFn: ({ id, decision, review_notes, score }) => reviewSkillCertificationRequest(id, { decision, review_notes, ...(decision === "approved" && score !== undefined ? { assessment_score: score } : {}) }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["skill-certification-queue"] }); toast.success("Skill certification decision saved"); },
    onError: (err) => toast.error(err.message || "Could not save the decision"),
  });
  const [active, setActive] = useState(null);
  const [notes, setNotes] = useState("");
  const [score, setScore] = useState("");
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-sm text-brick">{error.message}</p>;
  const requests = data?.data || [];
  if (!requests.length) return <Card className="p-10 text-center"><BadgeCheck className="mx-auto h-10 w-10 text-escrow" /><h3 className="mt-4 font-display text-lg text-slate">No skill requests pending</h3><p className="mt-2 text-sm text-slate-300">Students submit evidence from their profile after university enrollment is verified.</p></Card>;
  return <div className="space-y-4">
    {requests.map((request) => <Card key={request._id}><CardContent className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-slate">{request.skill_name}</p><p className="text-sm text-slate-300">{request.student_id?.name} · {request.student_id?.email}</p></div><Badge variant="warning">Pending review</Badge></div><div className="mt-4 space-y-2 rounded-control border border-ink-300 bg-ink-700 p-3 text-sm text-slate-300"><p><span className="font-semibold text-slate">Method:</span> {request.assessment_method.replaceAll("_", " ")}</p><p><span className="font-semibold text-slate">Student explanation:</span> {request.student_notes}</p>{request.evidence_file_id && <button type="button" className="font-semibold text-brass underline-offset-2 hover:underline" onClick={async () => { try { const blob = await fetchFileBlob(request.evidence_file_id._id, token); const url = URL.createObjectURL(blob); window.open(url, "_blank", "noopener,noreferrer"); window.setTimeout(() => URL.revokeObjectURL(url), 60000); } catch (err) { toast.error(err.message); } }}>Open evidence: {request.evidence_file_id.original_name}</button>}</div><div className="mt-4 flex gap-2"><Button size="sm" onClick={() => { setActive({ ...request, decision: "approved" }); setNotes(""); setScore(""); }}>Approve</Button><Button size="sm" variant="danger" onClick={() => { setActive({ ...request, decision: "rejected" }); setNotes(""); setScore(""); }}>Reject</Button></div></CardContent></Card>)}
    <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}><DialogContent><DialogHeader><DialogTitle>{active?.decision === "approved" ? "Approve skill certification" : "Reject skill certification"}</DialogTitle><DialogDescription>Record an accountable review decision for {active?.skill_name}.</DialogDescription></DialogHeader>{active?.decision === "approved" && active.assessment_method === "practical_assessment" && <label className="block text-sm font-semibold text-slate">Assessment score (0–100)<input type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} className="mt-2 h-10 w-full rounded-control border border-ink-300 bg-ink-50 px-3 text-sm text-slate" /></label>}<Textarea label="Review notes" rows={4} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Explain what you checked and why the decision is supported (at least 10 characters)." /><DialogFooter><Button variant="secondary" onClick={() => setActive(null)}>Cancel</Button><Button variant={active?.decision === "rejected" ? "danger" : "default"} loading={review.isPending} disabled={notes.trim().length < 10 || (active?.decision === "approved" && active.assessment_method === "practical_assessment" && score === "")} onClick={() => review.mutate({ id: active._id, decision: active.decision, review_notes: notes.trim(), score: score === "" ? undefined : Number(score) })}>{active?.decision === "approved" ? "Approve certification" : "Reject request"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

export default function UniversitiesPage() {
  const { token, user } = useAuth();
  const isStaff = user?.role === "university_staff";

  const { data: publicUnis } = useQuery({
    queryKey: ["universities"],
    queryFn: () => listUniversities("?limit=5"),
    enabled: !isStaff,
  });
  const { data: myUni } = useQuery({
    queryKey: ["my-university"],
    queryFn: () => getMyUniversity(token),
    enabled: isStaff && !!token,
  });
  const { data: verificationStats } = useQuery({
    queryKey: ["verification-stats"],
    queryFn: () => getVerificationStats(token),
    enabled: isStaff && !!token,
  });

  const unis = publicUnis?.data ?? [];
  const university = myUni?.data;
  const stats = verificationStats?.data ?? { pending: 0, approved: 0, rejected: 0 };

  return (
    <div className="w-full animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">University hub</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Verify, certify, and grow your student talent</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          {isStaff ? "Review verification requests, certify skills, and track institution outcomes." : "NexusWork partners with universities to verify identity and certify skills."}
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <Tabs defaultValue="verifications">
          <TabsList>
            <TabsTrigger value="verifications"><ShieldCheck className="h-4 w-4" /> Verifications</TabsTrigger>
            <TabsTrigger value="skills"><BadgeCheck className="h-4 w-4" /> Skill certification</TabsTrigger>
          </TabsList>
          <TabsContent value="verifications">
            {isStaff ? <VerificationQueue token={token} /> : <p className="text-sm text-slate-300">Sign in as university staff to manage verifications.</p>}
          </TabsContent>
          <TabsContent value="skills">
            {isStaff ? <SkillCertificationQueue token={token} /> : <p className="text-sm text-slate-300">Sign in as university staff to review skill requests.</p>}
          </TabsContent>
        </Tabs>

        <aside className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Institution</CardTitle></CardHeader>
            <CardContent>
              {isStaff ? (
                university ? (
                  <p className="flex items-center gap-2 text-sm text-slate-300">
                    <GraduationCap className="h-4 w-4 text-brass" /> {university.name}
                    <span className="text-slate-300/70">({university.domain})</span>
                  </p>
                ) : (
                  <div className="text-sm text-slate-300">
                    <p>
                      Matching your university's email domain only made your account eligible to apply — you
                      still need a platform admin to confirm you actually work there.
                    </p>
                    <Link
                      to="/profile"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brass underline-offset-4 hover:underline"
                    >
                      Submit staff verification
                    </Link>
                  </div>
                )
              ) : unis.length === 0 ? (
                <p className="text-sm text-slate-300">No universities registered yet.</p>
              ) : (
                <ul className="space-y-2">{unis.map((u) => <li key={u._id} className="flex items-center gap-2 text-sm text-slate-300"><GraduationCap className="h-4 w-4 text-brass" /> {u.name}</li>)}</ul>
              )}
              {isStaff && (
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-control bg-ink-700 p-3 text-center"><p className="font-mono text-lg text-brass">{stats.approved}</p><p className="text-xs text-slate-300">Verified</p></div>
                  <div className="rounded-control bg-ink-700 p-3 text-center"><p className="font-mono text-lg text-brass">{stats.pending}</p><p className="text-xs text-slate-300">Pending</p></div>
                  <div className="rounded-control bg-ink-700 p-3 text-center"><p className="font-mono text-lg text-brass">{stats.rejected}</p><p className="text-xs text-slate-300">Rejected</p></div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
