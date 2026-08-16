import { CONTRACT_STATUS } from "./contract.constants.js";
import { MILESTONE_STATUS } from "./payment.constants.js";
import { PROJECT_STATUS } from "./project.constants.js";



export const PROJECT_STATUS_META = {
  [PROJECT_STATUS.OPEN]: { label: "Open", tone: "success", hint: "Accepting proposals" },
  [PROJECT_STATUS.IN_PROGRESS]: { label: "In progress", tone: "info", hint: "Work is underway" },
  [PROJECT_STATUS.COMPLETED]: { label: "Completed", tone: "neutral", hint: "Delivered and closed" },
  [PROJECT_STATUS.CANCELLED]: { label: "Cancelled", tone: "danger", hint: "No longer accepting work" },
};

export const CONTRACT_STATUS_META = {
  [CONTRACT_STATUS.PENDING_SIGNATURE]: {
    label: "Awaiting signature",
    tone: "warning",
    hint: "Both parties must sign before work starts",
  },
  [CONTRACT_STATUS.ACTIVE]: { label: "Active", tone: "success", hint: "Contract is live" },
  [CONTRACT_STATUS.COMPLETED]: { label: "Completed", tone: "neutral", hint: "All milestones released" },
  [CONTRACT_STATUS.TERMINATED]: { label: "Terminated", tone: "danger", hint: "Ended before completion" },
};

export const MILESTONE_STATUS_META = {
  [MILESTONE_STATUS.NOT_FUNDED]: {
    label: "Not funded",
    tone: "neutral",
    hint: "The client hasn't placed funds in escrow yet",
  },
  [MILESTONE_STATUS.FUNDED]: {
    label: "Funded",
    tone: "info",
    hint: "Money is held in escrow and work can begin",
  },
  in_progress: { label: "In progress", tone: "info", hint: "Work has started" },
  [MILESTONE_STATUS.DELIVERED]: {
    label: "Delivered",
    tone: "warning",
    hint: "Waiting for the client to review",
  },
  revision_requested: {
    label: "Revision requested",
    tone: "warning",
    hint: "The client asked for changes",
  },
  [MILESTONE_STATUS.APPROVED]: { label: "Approved", tone: "success", hint: "Accepted by the client" },
  [MILESTONE_STATUS.DISPUTED]: { label: "Disputed", tone: "danger", hint: "Under review by NexusWork" },
  [MILESTONE_STATUS.RELEASED]: { label: "Paid out", tone: "success", hint: "Funds released to the freelancer" },
};

/** Proposal lifecycle — these match the backend proposals module enum exactly. */
export const PROPOSAL_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
};

export const PROPOSAL_STATUS_META = {
  [PROPOSAL_STATUS.PENDING]: { label: "Pending", tone: "warning", hint: "Waiting for the client to decide" },
  [PROPOSAL_STATUS.ACCEPTED]: { label: "Accepted", tone: "success", hint: "A contract has been created" },
  [PROPOSAL_STATUS.REJECTED]: { label: "Not selected", tone: "danger", hint: "The client chose someone else" },
  [PROPOSAL_STATUS.WITHDRAWN]: { label: "Withdrawn", tone: "neutral", hint: "You pulled this proposal" },
};

/** University-backed verification states. */
export const VERIFICATION_STATUS = {
  UNVERIFIED: "unverified",
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  EXPIRED: "expired",
};

export const VERIFICATION_STATUS_META = {
  [VERIFICATION_STATUS.UNVERIFIED]: {
    label: "Not verified",
    tone: "neutral",
    hint: "Submit your student details to get a verified badge",
  },
  [VERIFICATION_STATUS.PENDING]: {
    label: "Pending review",
    tone: "warning",
    hint: "Your university is reviewing your details",
  },
  [VERIFICATION_STATUS.VERIFIED]: {
    label: "Verified",
    tone: "success",
    hint: "Confirmed by your university",
  },
  [VERIFICATION_STATUS.REJECTED]: {
    label: "Needs attention",
    tone: "danger",
    hint: "Your university could not confirm these details",
  },
  [VERIFICATION_STATUS.EXPIRED]: {
    label: "Expired",
    tone: "warning",
    hint: "Re-confirm your enrolment to restore the badge",
  },
};

export const PAYMENT_STATUS_META = {
  pending: { label: "Pending", tone: "warning", hint: "Waiting to clear" },
  held: { label: "In escrow", tone: "info", hint: "Held until the milestone is approved" },
  succeeded: { label: "Completed", tone: "success" },
  paid: { label: "Paid", tone: "success" },
  failed: { label: "Failed", tone: "danger", hint: "The payment did not go through" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export const DISPUTE_STATUS_META = {
  open: { label: "Open", tone: "danger", hint: "Awaiting review" },
  under_review: { label: "Under review", tone: "warning" },
  resolved: { label: "Resolved", tone: "success" },
  dismissed: { label: "Dismissed", tone: "neutral" },
};

/** Registry consumed by <StatusBadge kind="…" />. */
export const STATUS_REGISTRY = {
  project: PROJECT_STATUS_META,
  contract: CONTRACT_STATUS_META,
  milestone: MILESTONE_STATUS_META,
  proposal: PROPOSAL_STATUS_META,
  verification: VERIFICATION_STATUS_META,
  payment: PAYMENT_STATUS_META,
  dispute: DISPUTE_STATUS_META,
};

/** Falls back to a humanised label so an unknown enum never leaks raw text. */
export function getStatusMeta(kind, status) {
  const known = STATUS_REGISTRY[kind]?.[status];
  if (known) return known;
  return {
    label: String(status || "Unknown").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
    tone: "neutral",
  };
}
