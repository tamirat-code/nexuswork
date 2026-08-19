export const PROJECT_STATUS = Object.freeze({
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

export const PROPOSAL_STATUS = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
});

export const CONTRACT_STATUS = Object.freeze({
  PENDING_REVIEW: "pending_review",
  PENDING_SIGNATURE: "pending_signature",
  ACTIVE: "active",
  COMPLETED: "completed",
  TERMINATED: "terminated",
});

export const MILESTONE_STATUS = Object.freeze({
  NOT_FUNDED: "not_funded",
  FUNDED: "funded",
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  DELIVERED: "delivered",
  REVISION_REQUESTED: "revision_requested",
  APPROVED: "approved",
  DISPUTED: "disputed",
  RELEASED: "released",
});