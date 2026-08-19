import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, MessageSquare, Paperclip, ShieldCheck, Flag, Clock, X } from "lucide-react";
import { getContract, signContract, listContractMilestones } from "../../services/api/contracts.api.js";
import { fundMilestone, submitMilestoneWork, approveMilestone } from "../../services/api/milestones.api.js";
import FundMilestoneDialog from "./FundMilestoneDialog.jsx";
import { openDispute } from "../../services/api/disputes.api.js";
import { listMessages, sendMessage } from "../../services/api/messages.api.js";
import { uploadFile } from "../../services/api/files.api.js";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/shadcn/tabs.jsx";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "../../components/ui/shadcn/dialog.jsx";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/shadcn/select.jsx";
import { ROLES } from "../../constants/roles.constants.js";
import { MILESTONE_STATUS } from "../../constants/payment.constants.js";

const MILESTONE_ORDER = [
  MILESTONE_STATUS.NOT_FUNDED,
  MILESTONE_STATUS.FUNDED,
  MILESTONE_STATUS.DELIVERED,
  MILESTONE_STATUS.APPROVED,
  MILESTONE_STATUS.RELEASED,
  MILESTONE_STATUS.DISPUTED,
];

function MilestoneStatusDot({ status }) {
  const color = {
    [MILESTONE_STATUS.NOT_FUNDED]: "bg-slate-300",
    [MILESTONE_STATUS.FUNDED]: "bg-blue-400",
    [MILESTONE_STATUS.DELIVERED]: "bg-amber-500",
    [MILESTONE_STATUS.APPROVED]: "bg-escrow",
    [MILESTONE_STATUS.RELEASED]: "bg-escrow",
    [MILESTONE_STATUS.DISPUTED]: "bg-brick",
  };
  return <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${color[status] || "bg-slate-400"}`} />;
}

function MilestoneCard({ milestone, role, onAction, fundingMilestoneId }) {
  const canFund = role === ROLES.CLIENT && milestone.status === MILESTONE_STATUS.NOT_FUNDED;
  const canDeliver = role === ROLES.STUDENT && milestone.status === MILESTONE_STATUS.FUNDED;
  const canApprove = role === ROLES.CLIENT && milestone.status === MILESTONE_STATUS.DELIVERED;
  const canDispute = milestone.status === MILESTONE_STATUS.FUNDED || milestone.status === MILESTONE_STATUS.DELIVERED;
  const isStartingFunding = fundingMilestoneId === milestone._id;

  return (
    <Card className="animate-fade-up">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <MilestoneStatusDot status={milestone.status} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate">{milestone.title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-300">
                <Clock className="h-3 w-3" />
                {formatDate(milestone.due_date)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-semibold text-brass">
              {formatCurrency(milestone.amount)}
            </span>
            <StatusBadge kind="milestone" status={milestone.status} showDot />
          </div>
        </div>

        {(canFund || canDeliver || canApprove || canDispute) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-300 pt-3">
            {canFund && (
              <Button size="sm" onClick={() => onAction("fund", milestone)} disabled={isStartingFunding}>
                {isStartingFunding ? "Preparing payment…" : "Fund milestone"}
              </Button>
            )}
            {canDeliver && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary">Submit work</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit work for {milestone.title}</DialogTitle>
                    <DialogDescription>
                      Add a note and any file links for the client to review.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    id="submission-note"
                    placeholder="Describe what was delivered and how to verify it…"
                  />
                  <DialogFooter>
                    <Button
                      size="sm"
                      onClick={() => {
                        const note = document.getElementById("submission-note").value;
                        onAction("deliver", milestone, { note });
                      }}
                    >
                      Submit for review
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {canApprove && (
              <>
                <Button size="sm" onClick={() => onAction("approve", milestone)}>
                  Approve &amp; release
                </Button>
                <Button size="sm" variant="ghost">Request revision</Button>
              </>
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
                    <DialogDescription>
                      Describe the issue with this milestone. Both parties and NexusWork will review it.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    id="dispute-reason"
                    placeholder="What went wrong? Be specific so we can help resolve it…"
                  />
                  <DialogFooter>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        const reason = document.getElementById("dispute-reason").value;
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

function ChatPanel({ contractId, token, contract, currentUserId }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState(null); // { _id, original_name }
  const fileInputRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", contractId],
    queryFn: () => listMessages(contractId, token),
  });

  // GET /messaging/contract/:id responds with { messages, total, limit, skip } — not the
  // array directly — same envelope shape as the milestones list endpoint.
  const messages = data?.data?.messages ?? [];
  const contractTitle = contract?.project_id?.title || "Contract";

  const uploadAttachment = useMutation({
    mutationFn: (file) => uploadFile(file, { relatedType: "message_attachment", token }),
    onSuccess: (res) => setPendingAttachment(res.data),
    onError: (err) => toast.error(err.message || "That file couldn't be uploaded"),
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      sendMessage(contractId, { body: message.trim(), attachments: pendingAttachment ? [pendingAttachment._id] : [] }, token),
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
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-12 w-3/5" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-300">
            No messages yet. Say hello and agree on the first milestone.
          </p>
        )}

        {messages.map((m) => {
          const isMine = String(m.sender_id?._id || m.sender_id) === String(currentUserId);
          return (
            <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-card border px-3.5 py-2.5 ${
                  isMine ? "border-brass/40 bg-brass/10" : "border-ink-300 bg-ink-700"
                }`}
              >
                <p className="text-xs font-semibold text-brass">{m.sender_id?.name || (isMine ? "You" : "User")}</p>
                {m.body && <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{m.body}</p>}
                {m.attachments?.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {m.attachments.map((file) => (
                      <a
                        key={file._id}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-medium text-brass underline-offset-2 hover:underline"
                      >
                        <Paperclip className="h-3 w-3" /> {file.original_name || "Attachment"}
                      </a>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-[11px] text-slate-300">{formatDate(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {pendingAttachment && (
        <div className="mb-2 flex items-center gap-2 rounded-control border border-ink-300 bg-ink-700 px-3 py-1.5 text-xs text-slate-300">
          <Paperclip className="h-3.5 w-3.5 text-brass" />
          <span className="flex-1 truncate">{pendingAttachment.original_name}</span>
          <button
            type="button"
            onClick={() => setPendingAttachment(null)}
            className="text-slate-300 hover:text-slate"
            aria-label="Remove attachment"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <form
        className="flex gap-2 border-t border-ink-300 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!message.trim() && !pendingAttachment) return;
          sendMutation.mutate();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadAttachment.mutate(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-11 w-11 shrink-0"
          aria-label="Attach file"
          disabled={uploadAttachment.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={uploadAttachment.isPending ? "Uploading attachment…" : "Type a message…"}
          className="flex-1"
        />
        <Button type="submit" size="sm" className="h-11" loading={sendMutation.isPending} disabled={uploadAttachment.isPending}>
          Send
        </Button>
      </form>
    </div>
  );
}

export default function ContractDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [fundingMilestone, setFundingMilestone] = useState(null);
  const fileExchangeInputRef = useRef(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["contract", id],
    queryFn: () => getContract(id, token),
  });

  const milestonesQuery = useQuery({
    queryKey: ["milestones", id],
    queryFn: () => listContractMilestones(id, token),
    enabled: !!token,
  });

  const contract = data?.data;
  // GET /milestones/contract/:id responds with { milestones, total, limit, skip } — not the
  // array directly — so unwrap one level further than the raw API envelope.
  const milestones = milestonesQuery.data?.data?.milestones ?? [];
  const isClient = contract && user && String(contract.client_id) === String(user._id);
  const isStudent = contract && user && String(contract.student_id) === String(user._id);
  const role = user?.role;
  const milestoneProgress = useMemo(() => {
    if (!milestones.length) return 0;
    const done = milestones.filter((m) =>
      [MILESTONE_STATUS.APPROVED, MILESTONE_STATUS.RELEASED].includes(m.status)
    ).length;
    return Math.round((done / milestones.length) * 100);
  }, [milestones]);
  const totalAmount = milestones.reduce((s, m) => s + (m.amount || 0), 0);
  const fundedAmount = milestones
    .filter((m) => [MILESTONE_STATUS.FUNDED, MILESTONE_STATUS.DELIVERED, MILESTONE_STATUS.APPROVED, MILESTONE_STATUS.RELEASED, MILESTONE_STATUS.DISPUTED].includes(m.status))
    .reduce((s, m) => s + (m.amount || 0), 0);

  const signMutation = useMutation({
    mutationFn: () => signContract(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      toast.success("Contract signed — both parties have now agreed.");
    },
    onError: (err) => toast.error(err.message || "Could not sign contract"),
  });

  const fundMutation = useMutation({
    mutationFn: ({ milestoneId }) => fundMilestone(milestoneId, token),
    onSuccess: (res, { milestone }) => {
      // This only creates the PaymentIntent — no money has moved yet. Open the card dialog
      // so the client actually completes payment; the "funded" toast fires from there once
      // Stripe confirms the charge and the server has verified it.
      setFundingMilestone({ milestone, clientSecret: res.data.client_secret });
    },
    onError: (err) => toast.error(err.message || "Could not start funding for this milestone"),
  });

  const shareFileMutation = useMutation({
    mutationFn: async (file) => {
      const uploaded = await uploadFile(file, { relatedType: "message_attachment", token });
      return sendMessage(id, { body: `📎 Shared a file: ${uploaded.data.original_name}`, attachments: [uploaded.data._id] }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
      toast.success("File shared in contract chat.");
    },
    onError: (err) => toast.error(err.message || "That file couldn't be shared"),
  });

  const deliverMutation = useMutation({
    mutationFn: ({ milestoneId, payload }) => submitMilestoneWork(milestoneId, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", id] });
      toast.success("Work submitted — waiting for client review.");
    },
    onError: (err) => toast.error(err.message || "Could not submit work"),
  });

  const approveMutation = useMutation({
    mutationFn: ({ milestoneId }) => approveMilestone(milestoneId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", id] });
      toast.success("Milestone approved — funds are being released.");
    },
    onError: (err) => toast.error(err.message || "Could not approve milestone"),
  });

  const disputeMutation = useMutation({
    mutationFn: ({ milestoneId, reason }) => openDispute(milestoneId, { reason }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", id] });
      toast.success("Dispute opened — our team will review it.");
    },
    onError: (err) => toast.error(err.message || "Could not open dispute"),
  });

  function handleAction(action, milestone, payload = {}) {
    switch (action) {
      case "fund":
        fundMutation.mutate({ milestoneId: milestone._id, milestone });
        break;
      case "deliver":
        deliverMutation.mutate({ milestoneId: milestone._id, payload });
        break;
      case "approve":
        approveMutation.mutate({ milestoneId: milestone._id });
        break;
      case "dispute":
        if (!payload.reason || payload.reason.trim().length < 10) {
          toast.error("Please describe the issue in at least 10 characters.");
          break;
        }
        disputeMutation.mutate({ milestoneId: milestone._id, reason: payload.reason.trim() });
        break;
      default:
        break;
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <h1 className="font-display text-xl text-slate">Contract couldn't be loaded</h1>
        <p className="mt-2 text-sm text-slate-300">{error.message}</p>
        <Link to="/contracts" className="mt-6 inline-block">
          <Button variant="secondary">Back to contracts</Button>
        </Link>
      </Card>
    );
  }

  const partnerName =
    contract?.client_id?.name || contract?.student_id?.name || "Partner";

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/contracts"
        className="inline-flex items-center gap-1.5 text-sm text-slate-300 transition-colors hover:text-brass"
      >
        <ArrowLeft className="h-4 w-4" /> All contracts
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            Contract · {contract?.project_id?.category || "Project"}
          </p>
          <h1 className="mt-1 font-display text-2xl leading-tight tracking-tight text-slate">
            {contract?.project_id?.title || "Contract"}
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            With {partnerName} · {formatDate(contract?.createdAt)}
          </p>
        </div>
        <StatusBadge kind="contract" status={contract?.status} showDot />
      </div>

      {contract?.status === "pending_signature" && (
        <Card className="mt-6 border-brass/30 bg-brass/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-brass" />
              <div>
                <p className="font-semibold text-slate">Awaiting signatures</p>
                <p className="text-sm text-slate-300">
                  Both parties must sign before funded milestones can be created.
                </p>
              </div>
            </div>
            <Button onClick={() => signMutation.mutate()} loading={signMutation.isPending}>
              Sign contract
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Milestones</CardTitle>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-slate-300">
                  {formatCurrency(fundedAmount)} / {formatCurrency(totalAmount)}
                </span>
                <Badge variant="secondary">{milestoneProgress}%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={milestoneProgress} className="mb-5 bg-ink-300" />
              <div className="space-y-3">
                {milestonesQuery.isLoading && (
                  <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                )}
                {!milestonesQuery.isLoading && milestones.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-300">
                    No milestones yet. {role === ROLES.CLIENT ? "Create the first funded milestone to get work started." : "Waiting for the client to create milestones."}
                  </p>
                )}
                {milestones.map((m) => (
                  <MilestoneCard
                    key={m._id}
                    milestone={m}
                    role={role}
                    onAction={handleAction}
                    fundingMilestoneId={fundMutation.isPending ? fundMutation.variables?.milestoneId : undefined}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submission history</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {milestones
                  .filter((m) => [MILESTONE_STATUS.DELIVERED, MILESTONE_STATUS.APPROVED, MILESTONE_STATUS.RELEASED].includes(m.status))
                  .map((m) => (
                    <div key={m._id} className="rounded-card border border-ink-300 bg-ink-700 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate">{m.title}</p>
                        <StatusBadge kind="milestone" status={m.status} showDot />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                        <span className="font-mono">v1.0</span>
                        <span>Delivered {formatDate(m.updatedAt || m.createdAt)}</span>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                          <Paperclip className="h-3.5 w-3.5" /> Files
                        </Button>
                      </div>
                    </div>
                  ))}
                {milestones.filter((m) => [MILESTONE_STATUS.DELIVERED, MILESTONE_STATUS.APPROVED, MILESTONE_STATUS.RELEASED].includes(m.status)).length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-300">Nothing delivered yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">File exchange</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileExchangeInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) shareFileMutation.mutate(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={shareFileMutation.isPending}
                  onClick={() => fileExchangeInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" /> {shareFileMutation.isPending ? "Uploading…" : "Upload files"}
                </Button>
                <p className="text-xs text-slate-300">
                  Contract-scoped files are shared with both parties automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Contract details</p>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-300">Status</dt>
                  <dd><StatusBadge kind="contract" status={contract?.status} showDot /></dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-300">Client</dt>
                  <dd className="truncate font-semibold text-slate">{contract?.client_id?.name || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-300">Student</dt>
                  <dd className="truncate font-semibold text-slate">{contract?.student_id?.name || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-300">Total</dt>
                  <dd className="font-mono text-brass">{formatCurrency(totalAmount)}</dd>
                </div>
              </dl>
              <Separator className="my-4" />
              <p className="text-xs leading-relaxed text-slate-300">
                <ShieldCheck className="mb-1 mr-1 inline h-3.5 w-3.5 text-brass" />
                Funds are held in escrow until each milestone is approved by the client.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="h-[420px] p-4">
              <ChatPanel contractId={id} token={token} contract={contract} currentUserId={user?.id} />
            </CardContent>
          </Card>
        </aside>
      </div>

      <FundMilestoneDialog
        contractId={id}
        funding={fundingMilestone}
        token={token}
        onClose={() => setFundingMilestone(null)}
      />
    </div>
  );
}