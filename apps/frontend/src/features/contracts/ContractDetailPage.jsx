import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Flag,
  MessageSquare,
  Paperclip,
  Send,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

import {
  getContract,
  reviewContract,
  signContract,
  listContractMilestones,
} from "../../services/api/contracts.api.js";

import {
  createMilestone,
  fundMilestone,
  submitMilestoneWork,
  approveMilestone,
  requestMilestoneRevision,
} from "../../services/api/milestones.api.js";

import { openDispute } from "../../services/api/disputes.api.js";
import { listMessages, sendMessage } from "../../services/api/messages.api.js";
import {
  listContractFiles,
  uploadFile,
} from "../../services/api/files.api.js";

import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";

import { StatusBadge } from "../../components/ui/shadcn/status-badge.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/shadcn/card.jsx";
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
} from "../../components/ui/shadcn/dialog.jsx";

import { ROLES } from "../../constants/roles.constants.js";
import { MILESTONE_STATUS } from "../../constants/payment.constants.js";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

/**
 * Safely normalize an ID.
 *
 * Supports:
 * - MongoDB objects: { _id: "..." }
 * - normal objects: { id: "..." }
 * - auth objects: { userId: "..." }
 * - strings
 */
function idOf(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return String(value._id || value.id || value.userId || "");
  }

  return String(value);
}

function MilestoneStatusDot({ status }) {
  const color = {
    [MILESTONE_STATUS.NOT_FUNDED]: "bg-slate-300",
    [MILESTONE_STATUS.FUNDED]: "bg-blue-400",
    [MILESTONE_STATUS.DELIVERED]: "bg-amber-500",
    [MILESTONE_STATUS.APPROVED]: "bg-escrow",
    [MILESTONE_STATUS.RELEASED]: "bg-escrow",
    [MILESTONE_STATUS.DISPUTED]: "bg-brick",
  };

  return (
    <span
      aria-hidden
      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
        color[status] || "bg-slate-400"
      }`}
    />
  );
}

function StripePaymentForm({ milestone, clientSecret, onDone }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();

    if (!stripe || !elements) return;

    setBusy(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/contracts/${milestone.contract_id}`,
      },
      redirect: "if_required",
    });

    setBusy(false);

    if (error) {
      toast.error(error.message || "Payment failed");
      return;
    }

    toast.success(
      "Payment authorized. Waiting for payment confirmation."
    );

    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-card border border-ink-300 bg-ink-800 p-4">
        <p className="text-sm font-semibold text-slate">
          {milestone.title}
        </p>

        <p className="mt-1 font-mono text-lg text-brass">
          {formatCurrency(milestone.amount)}
        </p>
      </div>

      <PaymentElement />

      <DialogFooter>
        <Button type="submit" disabled={!stripe} loading={busy}>
          Confirm payment
        </Button>
      </DialogFooter>
    </form>
  );
}

function MilestoneCard({
  milestone,
  role,
  onFund,
  onDeliver,
  onApprove,
  onRevision,
  onDispute,
  token,
}) {
  const [submissionNote, setSubmissionNote] = useState("");
  const [submissionFile, setSubmissionFile] = useState(null);
  const [revisionReason, setRevisionReason] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  const [submitOpen, setSubmitOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  const fileRef = useRef(null);

  const canFund =
    role === ROLES.CLIENT &&
    milestone.status === MILESTONE_STATUS.NOT_FUNDED;

  const canDeliver =
    role === ROLES.STUDENT &&
    milestone.status === MILESTONE_STATUS.FUNDED;

  const canApprove =
    role === ROLES.CLIENT &&
    milestone.status === MILESTONE_STATUS.DELIVERED;

  const canDispute =
    milestone.status === MILESTONE_STATUS.FUNDED ||
    milestone.status === MILESTONE_STATUS.DELIVERED;

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <MilestoneStatusDot status={milestone.status} />

            <div className="min-w-0">
              <p className="font-semibold text-slate">
                {milestone.title}
              </p>

              {milestone.description && (
                <p className="mt-1 text-sm text-slate-300">
                  {milestone.description}
                </p>
              )}

              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
                <Clock className="h-3 w-3" />
                Due {formatDate(milestone.due_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-semibold text-brass">
              {formatCurrency(milestone.amount)}
            </span>

            <StatusBadge
              kind="milestone"
              status={milestone.status}
              showDot
            />
          </div>
        </div>

        {(canFund || canDeliver || canApprove || canDispute) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-300 pt-3">
            {canFund && (
              <Button size="sm" onClick={() => onFund(milestone)}>
                Fund milestone
              </Button>
            )}

            {canDeliver && (
              <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSubmitOpen(true)}
                >
                  Submit work
                </Button>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Submit work for {milestone.title}
                    </DialogTitle>

                    <DialogDescription>
                      Upload the work and describe what the client should
                      review.
                    </DialogDescription>
                  </DialogHeader>

                  <Textarea
                    value={submissionNote}
                    onChange={(e) =>
                      setSubmissionNote(e.target.value)
                    }
                    placeholder="Describe what was delivered and how to verify it…"
                  />

                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setSubmissionFile(
                        e.target.files?.[0] || null
                      )
                    }
                  />

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />

                    {submissionFile
                      ? submissionFile.name
                      : "Choose work file"}
                  </Button>

                  <DialogFooter>
                    <Button
                      onClick={async () => {
                        if (!submissionFile) {
                          toast.error(
                            "Choose the work file before submitting."
                          );
                          return;
                        }

                        try {
                          const uploaded = await uploadFile(
                            submissionFile,
                            {
                              relatedType: "submission",
                              relatedId: milestone._id,
                              token,
                            }
                          );

                          await onDeliver(milestone, {
                            file_url: uploaded.data.url,
                            note: submissionNote.trim(),
                          });

                          setSubmitOpen(false);
                          setSubmissionNote("");
                          setSubmissionFile(null);
                        } catch (err) {
                          toast.error(
                            err.message ||
                              "Could not upload/submit work"
                          );
                        }
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
                <Button
                  size="sm"
                  onClick={() => onApprove(milestone)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve &amp; release
                </Button>

                <Dialog
                  open={revisionOpen}
                  onOpenChange={setRevisionOpen}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRevisionOpen(true)}
                  >
                    Request revision
                  </Button>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Request a revision
                      </DialogTitle>

                      <DialogDescription>
                        Explain exactly what needs to be changed.
                        The milestone will return to the student.
                      </DialogDescription>
                    </DialogHeader>

                    <Textarea
                      value={revisionReason}
                      onChange={(e) =>
                        setRevisionReason(e.target.value)
                      }
                      placeholder="What needs to be changed?"
                    />

                    <DialogFooter>
                      <Button
                        onClick={() => {
                          if (
                            revisionReason.trim().length < 10
                          ) {
                            toast.error(
                              "Please provide at least 10 characters of feedback."
                            );
                            return;
                          }

                          onRevision(
                            milestone,
                            revisionReason.trim()
                          );

                          setRevisionOpen(false);
                          setRevisionReason("");
                        }}
                      >
                        Request revision
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {canDispute && (
              <Dialog
                open={disputeOpen}
                onOpenChange={setDisputeOpen}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-brick"
                  onClick={() => setDisputeOpen(true)}
                >
                  <Flag className="h-3.5 w-3.5" />
                  Raise dispute
                </Button>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Raise a dispute
                    </DialogTitle>

                    <DialogDescription>
                      Describe the issue with this milestone.
                    </DialogDescription>
                  </DialogHeader>

                  <Textarea
                    value={disputeReason}
                    onChange={(e) =>
                      setDisputeReason(e.target.value)
                    }
                    placeholder="What went wrong?"
                  />

                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (
                          disputeReason.trim().length < 10
                        ) {
                          toast.error(
                            "Please describe the issue in at least 10 characters."
                          );
                          return;
                        }

                        onDispute(
                          milestone,
                          disputeReason.trim()
                        );

                        setDisputeOpen(false);
                        setDisputeReason("");
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
  const [attachment, setAttachment] = useState(null);

  const attachmentRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", contractId],
    queryFn: () => listMessages(contractId, token),
  });

  const messages = Array.isArray(data?.data)
    ? data.data
    : [];

  const sendMutation = useMutation({
    mutationFn: async () => {
      const attachments = [];

      if (attachment) {
        const uploaded = await uploadFile(attachment, {
          relatedType: "message_attachment",
          token,
        });

        attachments.push(uploaded.data._id);
      }

      return sendMessage(
        contractId,
        {
          body: message.trim(),
          attachments,
        },
        token
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", contractId],
      });

      setMessage("");
      setAttachment(null);

      toast.success("Message sent");
    },

    onError: (err) =>
      toast.error(
        err.message || "Could not send message"
      ),
  });

  const contractTitle =
    contract?.project_id?.title || "Contract";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-ink-300 pb-3">
        <MessageSquare className="h-4 w-4 text-brass" />

        <p className="text-sm font-semibold text-slate">
          Contract chat
        </p>

        <Badge variant="outline" className="ml-auto">
          {contractTitle}
        </Badge>
      </div>

      <div
        className="flex-1 space-y-3 overflow-y-auto py-4 pr-1"
        aria-live="polite"
      >
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-12 w-1/2" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-300">
            No messages yet. Say hello and agree on the first
            milestone.
          </p>
        )}

        {messages.map((m) => (
          <div key={m._id} className="flex justify-start">
            <div className="max-w-[85%] rounded-card border border-ink-300 bg-ink-700 px-3.5 py-2.5">
              <p className="text-xs font-semibold text-brass">
                {m.sender_id?.name || "User"}
              </p>

              <p className="mt-0.5 text-sm leading-relaxed text-slate-300">
                {m.body}
              </p>

              {m.attachments?.map((file) => (
                <a
                  key={file._id}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center gap-2 text-xs text-brass hover:underline"
                >
                  <Paperclip className="h-3.5 w-3.5" />

                  {file.original_name}
                </a>
              ))}

              <p className="mt-1 text-[11px] text-slate-300">
                {formatDate(m.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form
        className="border-t border-ink-300 pt-3"
        onSubmit={(e) => {
          e.preventDefault();

          if (!message.trim() && !attachment) return;

          sendMutation.mutate();
        }}
      >
        <div className="flex gap-2">
          <input
            ref={attachmentRef}
            type="file"
            className="hidden"
            onChange={(e) =>
              setAttachment(
                e.target.files?.[0] || null
              )
            }
          />

          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-11 w-11 shrink-0"
            aria-label="Attach file"
            onClick={() =>
              attachmentRef.current?.click()
            }
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Input
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder={
              attachment
                ? `Attached: ${attachment.name}`
                : "Type a message…"
            }
            className="flex-1"
          />

          <Button
            type="submit"
            size="sm"
            className="h-11"
            loading={sendMutation.isPending}
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function ContractDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] =
    useState(false);

  const [fundingMilestone, setFundingMilestone] =
    useState(null);

  const [paymentSecret, setPaymentSecret] =
    useState(null);

  const [createMilestoneOpen, setCreateMilestoneOpen] =
    useState(false);

  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    amount: "",
    due_date: "",
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["contract", id],
    queryFn: () => getContract(id, token),
    enabled: !!token && !!id,
  });

  const milestonesQuery = useQuery({
    queryKey: ["milestones", id],
    queryFn: () =>
      listContractMilestones(id, token),
    enabled: !!token && !!id,
  });

  const filesQuery = useQuery({
    queryKey: ["contract-files", id],
    queryFn: () =>
      listContractFiles(id, token),
    enabled: !!token && !!id,
  });

  const contract = data?.data;

  const milestonesResponse =
    milestonesQuery.data?.data;

  const milestones = Array.isArray(
    milestonesResponse
  )
    ? milestonesResponse
    : Array.isArray(
        milestonesResponse?.milestones
      )
      ? milestonesResponse.milestones
      : [];

  /*
   * ---------------------------------------------------------
   * USER / CONTRACT IDENTITY
   * ---------------------------------------------------------
   *
   * Important fix:
   *
   * Previously:
   *   const userId = idOf(user?._id);
   *
   * If useAuth() returns { id: "..." } instead of
   * { _id: "..." }, userId became "".
   *
   * Now idOf(user) supports _id, id and userId.
   */
  const role = user?.role;

  const userId = idOf(user);
  const clientId = idOf(contract?.client_id);
  const studentId = idOf(contract?.student_id);

  const isClient = userId === clientId;
  const isStudent = userId === studentId;

  /*
   * ---------------------------------------------------------
   * DEBUG
   * ---------------------------------------------------------
   *
   * Keep this temporarily while testing.
   */
  console.log("CONTRACT SIGN DEBUG", {
    user,
    role,
    status: contract?.status,

    userId,
    clientId,
    studentId,

    isClient,
    isStudent,

    myReviewed: isClient
      ? Boolean(
          contract?.client_review?.reviewed_at ||
          contract?.client_review?.reviewedAt
        )
      : isStudent
        ? Boolean(
            contract?.student_review?.reviewed_at ||
            contract?.student_review?.reviewedAt
          )
        : false,

    mySigned: isClient
      ? Boolean(
          contract?.client_signature?.signed_at ||
          contract?.client_signature?.signedAt ||
          contract?.client_signed_at ||
          contract?.client_signedAt
        )
      : isStudent
        ? Boolean(
            contract?.student_signature?.signed_at ||
            contract?.student_signature?.signedAt ||
            contract?.student_signed_at ||
            contract?.student_signedAt
          )
        : false,

    clientReview: contract?.client_review,
    studentReview: contract?.student_review,

    clientSignature: contract?.client_signature,
    studentSignature: contract?.student_signature,
  });

  const totalAmount = milestones.reduce(
    (sum, m) => sum + Number(m.amount || 0),
    0
  );

  const fundedAmount = milestones
    .filter((m) =>
      [
        MILESTONE_STATUS.FUNDED,
        MILESTONE_STATUS.DELIVERED,
        MILESTONE_STATUS.APPROVED,
        MILESTONE_STATUS.RELEASED,
        MILESTONE_STATUS.DISPUTED,
      ].includes(m.status)
    )
    .reduce(
      (sum, m) => sum + Number(m.amount || 0),
      0
    );

  const milestoneProgress = useMemo(() => {
    if (!milestones.length) return 0;

    const done = milestones.filter((m) =>
      [
        MILESTONE_STATUS.APPROVED,
        MILESTONE_STATUS.RELEASED,
      ].includes(m.status)
    ).length;

    return Math.round(
      (done / milestones.length) * 100
    );
  }, [milestones]);

  /*
   * ---------------------------------------------------------
   * REVIEW / SIGN STATE
   * ---------------------------------------------------------
   */

  const myReviewed = isClient
    ? Boolean(
        contract?.client_review?.reviewed_at ||
        contract?.client_review?.reviewedAt
      )
    : isStudent
      ? Boolean(
          contract?.student_review?.reviewed_at ||
          contract?.student_review?.reviewedAt
        )
      : false;

  const mySigned = isClient
    ? Boolean(
        contract?.client_signature?.signed_at ||
        contract?.client_signature?.signedAt ||
        contract?.client_signed_at ||
        contract?.client_signedAt
      )
    : isStudent
      ? Boolean(
          contract?.student_signature?.signed_at ||
          contract?.student_signature?.signedAt ||
          contract?.student_signed_at ||
          contract?.student_signedAt
        )
      : false;

  const canSign =
    contract?.status === "pending_signature" &&
    myReviewed &&
    !mySigned;

  /*
   * ---------------------------------------------------------
   * MUTATIONS
   * ---------------------------------------------------------
   */

  const reviewMutation = useMutation({
    mutationFn: () =>
      reviewContract(id, token),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["contract", id],
      });

      setReviewOpen(false);
      setReviewConfirmed(false);

      toast.success(
        "Contract reviewed. You can sign it when both parties have reviewed."
      );
    },

    onError: (err) =>
      toast.error(
        err.message || "Could not review contract"
      ),
  });

  const signMutation = useMutation({
    mutationFn: () =>
      signContract(id, token),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["contract", id],
      });

      toast.success("Signature recorded.");
    },

    onError: (err) =>
      toast.error(
        err.message || "Could not sign contract"
      ),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createMilestone(
        id,
        {
          title: newMilestone.title.trim(),
          description:
            newMilestone.description.trim(),
          amount: Number(newMilestone.amount),
          due_date: newMilestone.due_date,
        },
        token
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["milestones", id],
      });

      setCreateMilestoneOpen(false);

      setNewMilestone({
        title: "",
        description: "",
        amount: "",
        due_date: "",
      });

      toast.success("Milestone created.");
    },

    onError: (err) =>
      toast.error(
        err.message || "Could not create milestone"
      ),
  });

  const fundMutation = useMutation({
    mutationFn: (milestone) =>
      fundMilestone(milestone._id, token),

    onSuccess: (response, milestone) => {
      const secret =
        response?.data?.client_secret;

      if (!secret) {
        toast.error(
          "Payment setup did not return a Stripe client secret."
        );
        return;
      }

      setFundingMilestone(milestone);
      setPaymentSecret(secret);
    },

    onError: (err) =>
      toast.error(
        err.message || "Could not start payment"
      ),
  });

  const deliverMutation = useMutation({
    mutationFn: ({ milestoneId, payload }) =>
      submitMilestoneWork(
        milestoneId,
        payload,
        token
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["milestones", id],
      });

      toast.success(
        "Work submitted. The client can now review it."
      );
    },

    onError: (err) =>
      toast.error(
        err.message || "Could not submit work"
      ),
  });

  const approveMutation = useMutation({
    mutationFn: ({ milestoneId }) =>
      approveMilestone(milestoneId, token),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["milestones", id],
      });

      queryClient.invalidateQueries({
        queryKey: ["contract", id],
      });

      toast.success(
        "Milestone approved and payment release completed."
      );
    },

    onError: (err) =>
      toast.error(
        err.message || "Could not approve milestone"
      ),
  });

  const revisionMutation = useMutation({
    mutationFn: ({ submissionId, reason }) =>
      requestMilestoneRevision(
        submissionId,
        reason,
        token
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["milestones", id],
      });

      toast.success("Revision requested.");
    },

    onError: (err) =>
      toast.error(
        err.message ||
          "Could not request revision"
      ),
  });

  const disputeMutation = useMutation({
    mutationFn: ({ milestoneId, reason }) =>
      openDispute(
        milestoneId,
        { reason },
        token
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["milestones", id],
      });

      toast.success("Dispute opened.");
    },

    onError: (err) =>
      toast.error(
        err.message || "Could not open dispute"
      ),
  });

  async function uploadContractFile(file) {
    try {
      await uploadFile(file, {
        relatedType: "contract",
        relatedId: id,
        token,
      });

      queryClient.invalidateQueries({
        queryKey: ["contract-files", id],
      });

      toast.success(
        "File uploaded and shared with both parties."
      );
    } catch (err) {
      toast.error(
        err.message || "Could not upload file"
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERROR
   * ---------------------------------------------------------
   */

  if (error || !contract) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <h1 className="font-display text-xl text-slate">
          Contract couldn't be loaded
        </h1>

        <p className="mt-2 text-sm text-slate-300">
          {error?.message ||
            "Contract not found"}
        </p>

        <Link
          to="/contracts"
          className="mt-6 inline-block"
        >
          <Button variant="secondary">
            Back to contracts
          </Button>
        </Link>
      </Card>
    );
  }

  const partnerName = isClient
    ? contract.student_id?.name ||
      "Student"
    : contract.client_id?.name ||
      "Client";

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/contracts"
        className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-brass"
      >
        <ArrowLeft className="h-4 w-4" />
        All contracts
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            Contract ·{" "}
            {contract.project_id?.category ||
              "Project"}
          </p>

          <h1 className="mt-1 font-display text-2xl text-slate">
            {contract.project_id?.title ||
              contract.terms?.title ||
              "Contract"}
          </h1>

          <p className="mt-1 text-sm text-slate-300">
            With {partnerName} · Created{" "}
            {formatDate(contract.createdAt)}
          </p>
        </div>

        <StatusBadge
          kind="contract"
          status={contract.status}
          showDot
        />
      </div>

      {/* =====================================================
          CONTRACT REVIEW
          ===================================================== */}

      {contract.status === "pending_review" && (
        <Card className="mt-6 border-brass/30 bg-brass/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="font-semibold text-slate">
                {myReviewed
                  ? "Waiting for the other party to review"
                  : "Contract requires your review"}
              </p>

              <p className="mt-1 text-sm text-slate-300">
                Both parties must review the exact
                contract terms before signatures are
                enabled.
              </p>
            </div>

            {!myReviewed && (
              <Button
                onClick={() =>
                  setReviewOpen(true)
                }
              >
                Review contract
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* =====================================================
          CONTRACT SIGNATURE
          ===================================================== */}

      {contract.status === "pending_signature" && (
        <Card className="mt-6 border-brass/30 bg-brass/5">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate">
                  {mySigned
                    ? "Waiting for the other signature"
                    : "Contract ready to sign"}
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  Review status: client{" "}
                  {contract.client_review
                    ?.reviewed_at
                    ? "✓"
                    : "○"}{" "}
                  · student{" "}
                  {contract.student_review
                    ?.reviewed_at
                    ? "✓"
                    : "○"}
                </p>
              </div>

              {canSign && (
                <Button
                  onClick={() =>
                    signMutation.mutate()
                  }
                  loading={
                    signMutation.isPending
                  }
                >
                  <ShieldCheck className="h-4 w-4" />
                  Sign contract
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* =====================================================
          ACTIVE CONTRACT
          ===================================================== */}

      {contract.status === "active" && (
        <Card className="mt-6 border-escrow/30 bg-escrow/5">
          <CardContent className="flex items-center gap-3 p-5">
            <CheckCircle2 className="h-5 w-5 text-escrow" />

            <div>
              <p className="font-semibold text-slate">
                Contract is active
              </p>

              <p className="text-sm text-slate-300">
                {isClient
                  ? "Create and fund a milestone to start the project."
                  : "Once the client funds a milestone, you can start and submit work."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-6">
          {/* =================================================
              AGREEMENT
              ================================================= */}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Agreement
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-300">
                  Description
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate">
                  {contract.terms
                    ?.description || "—"}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-300">
                    Total
                  </p>

                  <p className="mt-1 font-mono text-lg text-brass">
                    {formatCurrency(
                      contract.terms
                        ?.total_amount || 0
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-300">
                    Deadline
                  </p>

                  <p className="mt-1 text-sm text-slate">
                    {formatDate(
                      contract.terms?.deadline
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-300">
                    Delivery
                  </p>

                  <p className="mt-1 text-sm text-slate">
                    {contract.terms
                      ?.delivery_time_days ||
                      "—"}{" "}
                    days
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-300">
                    Version
                  </p>

                  <p className="mt-1 font-mono text-sm text-slate">
                    v{contract.version}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm text-slate-300">
                <p>
                  <strong className="text-slate">
                    Payment:
                  </strong>{" "}
                  {contract.terms
                    ?.payment_terms}
                </p>

                <p>
                  <strong className="text-slate">
                    Revisions:
                  </strong>{" "}
                  {contract.terms
                    ?.revision_policy}
                </p>

                <p>
                  <strong className="text-slate">
                    Cancellation:
                  </strong>{" "}
                  {contract.terms
                    ?.cancellation_terms}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* =================================================
              MILESTONES
              ================================================= */}

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">
                Milestones
              </CardTitle>

              {contract.status === "active" &&
                isClient && (
                  <Button
                    size="sm"
                    onClick={() =>
                      setCreateMilestoneOpen(true)
                    }
                  >
                    Add milestone
                  </Button>
                )}
            </CardHeader>

            <CardContent>
              <div className="mb-5 flex items-center gap-3">
                <Progress
                  value={milestoneProgress}
                  className="flex-1 bg-ink-300"
                />

                <Badge variant="secondary">
                  {milestoneProgress}%
                </Badge>
              </div>

              <div className="space-y-3">
                {milestonesQuery.isLoading && (
                  <Skeleton className="h-24 w-full" />
                )}

                {!milestonesQuery.isLoading &&
                  milestones.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-300">
                      {isClient
                        ? "Create the first milestone to start the project."
                        : "Waiting for the client to create a milestone."}
                    </p>
                  )}

                {milestones.map(
                  (milestone) => (
                    <MilestoneCard
                      key={milestone._id}
                      milestone={milestone}
                      role={role}
                      onFund={(m) =>
                        fundMutation.mutate(m)
                      }
                      onDeliver={async (
                        m,
                        payload
                      ) => {
                        await deliverMutation.mutateAsync(
                          {
                            milestoneId:
                              m._id,
                            payload,
                          }
                        );
                      }}
                      onApprove={(m) =>
                        approveMutation.mutate(
                          {
                            milestoneId:
                              m._id,
                          }
                        )
                      }
                      onRevision={async (
                        m,
                        reason
                      ) => {
                        const submissions =
                          await fetch(
                            `${
                              import.meta.env
                                .VITE_API_BASE_URL ||
                              "http://localhost:5000/v1"
                            }/submissions/milestone/${
                              m._id
                            }`,
                            {
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            }
                          ).then((r) =>
                            r.json()
                          );

                        const latest =
                          Array.isArray(
                            submissions?.data
                          )
                            ? submissions.data[
                                submissions.data
                                  .length - 1
                              ]
                            : null;

                        if (!latest) {
                          toast.error(
                            "No submission found to revise."
                          );
                          return;
                        }

                        revisionMutation.mutate(
                          {
                            submissionId:
                              latest._id,
                            reason,
                          }
                        );
                      }}
                      onDispute={(
                        m,
                        reason
                      ) =>
                        disputeMutation.mutate(
                          {
                            milestoneId:
                              m._id,
                            reason,
                          }
                        )
                      }
                      token={token}
                    />
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* =================================================
              FILE EXCHANGE
              ================================================= */}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                File exchange
              </CardTitle>
            </CardHeader>

            <CardContent>
              <label className="inline-flex cursor-pointer">
                <input
                  type="file"
                  className="sr-only"
                  onChange={(e) => {
                    const file =
                      e.target.files?.[0];

                    if (file) {
                      uploadContractFile(file);
                    }

                    e.target.value = "";
                  }}
                />

                <span className="inline-flex h-9 items-center gap-2 rounded-control border border-ink-300 bg-ink-50 px-3 text-sm font-semibold text-slate hover:border-brass/40">
                  <Upload className="h-4 w-4" />
                  Upload file
                </span>
              </label>

              <div className="mt-4 space-y-2">
                {(filesQuery.data?.data || []).map(
                  (file) => (
                    <a
                      key={file._id}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-control border border-ink-300 bg-ink-700 px-3 py-2 text-sm text-slate hover:border-brass/40"
                    >
                      <Download className="h-4 w-4 text-brass" />

                      <span className="truncate">
                        {file.original_name}
                      </span>

                      <span className="ml-auto text-xs text-slate-300">
                        {file.owner_id?.name ||
                          "User"}
                      </span>
                    </a>
                  )
                )}

                {!filesQuery.isLoading &&
                  !(
                    filesQuery.data?.data || []
                  ).length && (
                    <p className="text-xs text-slate-300">
                      No contract files yet.
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===================================================
            SIDEBAR
            =================================================== */}

        <aside className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                Contract details
              </p>

              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-300">
                    Status
                  </dt>

                  <dd>
                    <StatusBadge
                      kind="contract"
                      status={contract.status}
                      showDot
                    />
                  </dd>
                </div>

                <div className="flex justify-between gap-3">
                  <dt className="text-slate-300">
                    Client
                  </dt>

                  <dd className="truncate font-semibold text-slate">
                    {contract.client_id
                      ?.name || "—"}
                  </dd>
                </div>

                <div className="flex justify-between gap-3">
                  <dt className="text-slate-300">
                    Student
                  </dt>

                  <dd className="truncate font-semibold text-slate">
                    {contract.student_id
                      ?.name || "—"}
                  </dd>
                </div>

                <div className="flex justify-between gap-3">
                  <dt className="text-slate-300">
                    Milestones
                  </dt>

                  <dd className="font-mono text-slate">
                    {milestones.length}
                  </dd>
                </div>

                <div className="flex justify-between gap-3">
                  <dt className="text-slate-300">
                    Milestone total
                  </dt>

                  <dd className="font-mono text-brass">
                    {formatCurrency(totalAmount)}
                  </dd>
                </div>
              </dl>

              <Separator className="my-4" />

              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  Client review{" "}
                  {contract.client_review
                    ?.reviewed_at
                    ? "✓"
                    : "○"}
                </p>

                <p>
                  Student review{" "}
                  {contract.student_review
                    ?.reviewed_at
                    ? "✓"
                    : "○"}
                </p>

                <p>
                  Client signature{" "}
                  {contract.client_signature
                    ?.signed_at
                    ? "✓"
                    : "○"}
                </p>

                <p>
                  Student signature{" "}
                  {contract.student_signature
                    ?.signed_at
                    ? "✓"
                    : "○"}
                </p>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-slate-300">
                <ShieldCheck className="mb-1 mr-1 inline h-3.5 w-3.5 text-brass" />
                Funds are held in escrow until
                the client approves submitted
                work.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="h-[420px] p-4">
              <ChatPanel
                contractId={id}
                token={token}
                contract={contract}
              />
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* =====================================================
          REVIEW DIALOG
          ===================================================== */}

      <Dialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Review contract
            </DialogTitle>

            <DialogDescription>
              Read the agreement carefully. Reviewing
              records that you saw and accepted this
              exact version.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 rounded-card border border-ink-300 bg-ink-800 p-4">
            <h3 className="font-semibold text-slate">
              {contract.terms?.title}
            </h3>

            <p className="whitespace-pre-wrap text-sm text-slate-300">
              {contract.terms?.description}
            </p>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="text-slate-300">
                  Total:
                </span>{" "}
                {formatCurrency(
                  contract.terms
                    ?.total_amount || 0
                )}
              </div>

              <div>
                <span className="text-slate-300">
                  Deadline:
                </span>{" "}
                {formatDate(
                  contract.terms?.deadline
                )}
              </div>

              <div>
                <span className="text-slate-300">
                  Delivery:
                </span>{" "}
                {
                  contract.terms
                    ?.delivery_time_days
                }{" "}
                days
              </div>

              <div>
                <span className="text-slate-300">
                  Version:
                </span>{" "}
                v{contract.version}
              </div>
            </div>

            <Separator />

            <p className="text-sm text-slate-300">
              {contract.terms?.payment_terms}
            </p>

            <p className="text-sm text-slate-300">
              {contract.terms?.revision_policy}
            </p>

            <p className="text-sm text-slate-300">
              {contract.terms
                ?.cancellation_terms}
            </p>
          </div>

          <label className="flex items-start gap-3 text-sm text-slate">
            <input
              type="checkbox"
              checked={reviewConfirmed}
              onChange={(e) =>
                setReviewConfirmed(
                  e.target.checked
                )
              }
              className="mt-1"
            />

            <span>
              I have read and reviewed the complete
              contract and understand that this review
              applies to version{" "}
              <strong>
                v{contract.version}
              </strong>
              .
            </span>
          </label>

          <DialogFooter>
            <Button
              disabled={!reviewConfirmed}
              loading={
                reviewMutation.isPending
              }
              onClick={() =>
                reviewMutation.mutate()
              }
            >
              I reviewed this contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =====================================================
          FUND MILESTONE / STRIPE
          ===================================================== */}

      <Dialog
        open={Boolean(
          fundingMilestone && paymentSecret
        )}
        onOpenChange={(open) => {
          if (!open) {
            setFundingMilestone(null);
            setPaymentSecret(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Fund milestone
            </DialogTitle>

            <DialogDescription>
              Payment is secured in escrow and released
              only after client approval.
            </DialogDescription>
          </DialogHeader>

          {!stripePromise ? (
            <p className="text-sm text-brick">
              Stripe is not configured. Set
              VITE_STRIPE_PUBLISHABLE_KEY in the
              frontend environment.
            </p>
          ) : (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: paymentSecret,
                appearance: {
                  theme: "night",
                },
              }}
            >
              <StripePaymentForm
                milestone={fundingMilestone}
                clientSecret={paymentSecret}
                onDone={() => {
                  queryClient.invalidateQueries({
                    queryKey: [
                      "milestones",
                      id,
                    ],
                  });

                  setFundingMilestone(null);
                  setPaymentSecret(null);
                }}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>

      {/* =====================================================
          CREATE MILESTONE
          ===================================================== */}

      <Dialog
        open={createMilestoneOpen}
        onOpenChange={setCreateMilestoneOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create milestone
            </DialogTitle>

            <DialogDescription>
              The total of all milestones cannot exceed
              the contract amount.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={newMilestone.title}
            onChange={(e) =>
              setNewMilestone((v) => ({
                ...v,
                title: e.target.value,
              }))
            }
            placeholder="Milestone title"
          />

          <Textarea
            value={newMilestone.description}
            onChange={(e) =>
              setNewMilestone((v) => ({
                ...v,
                description:
                  e.target.value,
              }))
            }
            placeholder="What will be delivered?"
          />

          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={newMilestone.amount}
            onChange={(e) =>
              setNewMilestone((v) => ({
                ...v,
                amount: e.target.value,
              }))
            }
            placeholder="Amount"
          />

          <Input
            type="date"
            value={newMilestone.due_date}
            onChange={(e) =>
              setNewMilestone((v) => ({
                ...v,
                due_date: e.target.value,
              }))
            }
          />

          <DialogFooter>
            <Button
              disabled={
                !newMilestone.title.trim() ||
                !newMilestone.amount ||
                !newMilestone.due_date
              }
              loading={
                createMutation.isPending
              }
              onClick={() =>
                createMutation.mutate()
              }
            >
              Create milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}