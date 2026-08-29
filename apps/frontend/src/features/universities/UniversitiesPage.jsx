import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, GraduationCap, ShieldCheck, XCircle, FileText } from "lucide-react";
import { getVerifications, getVerificationStats, reviewVerification } from "../../services/api/verifications.api.js";
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
            <Card className="p-6">
              <p className="text-sm text-slate-300">Certify a student's skill by inviting them to submit evidence, then approve here.</p>
              <Button className="mt-4" variant="secondary">Certify a skill</Button>
            </Card>
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
