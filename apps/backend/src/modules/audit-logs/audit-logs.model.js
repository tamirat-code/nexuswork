import mongoose from "mongoose";

const AUDIT_ACTION_TYPES = [
  "user_suspended", "user_restored", "user_deleted", "dispute_resolved",
  "payment_reversed", "payment_adjusted", "contract_terminated",
  "verification_approved", "verification_rejected", "user_role_changed",
  "commission_adjusted", "content_removed", "fraud_reported", "login_via_admin",
  "settings_changed", "payment_deposit_initiated", "payment_deposit_succeeded",
  "payment_deposit_failed", "payment_released", "payment_release_failed",
  "payment_refunded", "payment_commission_recorded", "milestone_work_submitted",
  "milestone_revision_requested", "CONTRACT_CREATED", "CONTRACT_SIGNED",
  "CONTRACT_ACTIVATED", "MILESTONE_CREATED", "MILESTONE_FUNDED",
  "CONTRACT_REVIEWED", "MILESTONE_FUNDING_REQUESTED", "MILESTONE_WORK_STARTED",
  "MILESTONE_SUBMITTED", "MILESTONE_REVISION_REQUESTED", "MILESTONE_APPROVED",
  "MILESTONE_DISPUTED", "MILESTONE_RELEASE_REQUESTED", "MILESTONE_RELEASED",
  "SUBMISSION_CREATED", "SUBMISSION_APPROVED", "SUBMISSION_REVISION_REQUESTED",
  "MESSAGE_CREATED", "INVOICE_CREATED", "INVOICE_STATUS_UPDATED", "FILE_CREATED", "FILE_DELETED",
  "PAYMENT_CREATED", "PAYMENT_SUCCEEDED", "PAYMENT_FAILED", "REFUND_REQUESTED",
  "REFUND_SUCCEEDED", "REFUND_FAILED", "DISPUTE_OPENED", "DISPUTE_RESOLVED",
  "RELEASE_REQUESTED", "RELEASE_SUCCEEDED", "RELEASE_FAILED",
  "MEETING_CREATED", "MEETING_UPDATED", "MEETING_CANCELLED", "MEETING_STARTED", "MEETING_ENDED", "MEETING_JOINED", "MEETING_LEFT", "PROPOSAL_CV_VIEWED", "PROPOSAL_WITHDRAWN",
  "WITHDRAWAL_REQUESTED", "WITHDRAWAL_SUCCEEDED", "WITHDRAWAL_FAILED",
];


const auditLogsSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, immutable: true },
    eventType: { type: String, required: true, immutable: true },
    action: { type: String, required: true, immutable: true },
    previousState: { type: mongoose.Schema.Types.Mixed, default: null, immutable: true },
    newState: { type: mongoose.Schema.Types.Mixed, default: null, immutable: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {}, immutable: true },
    requestId: { type: String, required: true, immutable: true },
    correlationId: { type: String, required: true, immutable: true },

    actor_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", immutable: true },
    actor_role: {
      type: String,
      enum: ["admin", "moderator", "client", "student", "university_staff", "system"],
      default: "system",
      immutable: true,
    },
    action_type: {
      type: String,
      enum: AUDIT_ACTION_TYPES,
      required: true,
      immutable: true,
    },
      entity_type: {
      type: String,
      enum: ["user", "contract", "dispute", "payment", "verification", "project", "proposal", "milestone", "submission", "file", "message", "invoice", "meeting"],
      required: true,
    },
    entity_id: { type: mongoose.Schema.Types.ObjectId, immutable: true },
    related_entity_type: { type: String, immutable: true },
    related_entity_id: { type: mongoose.Schema.Types.ObjectId, immutable: true },
    reason: { type: String, immutable: true },
    details: { type: mongoose.Schema.Types.Mixed, immutable: true },
    ip_address: { type: String, immutable: true },
    user_agent: { type: String, immutable: true },
    status: {
      type: String,
      enum: ["logged", "flagged_for_review"],
      default: "logged",
    },
  },
  {
    timestamps: true,
    // Immutable flag ensures we prevent accidental updates
    collection: "audit_logs",
  }
);

auditLogsSchema.pre("save", function preventAuditUpdates(next) {
  if (!this.isNew) return next(new Error("Audit records are append-only"));
  next();
});

auditLogsSchema.pre(
  ["updateOne", "updateMany", "findOneAndUpdate", "findOneAndReplace", "deleteOne", "deleteMany", "findOneAndDelete"],
  function preventAuditQueryMutation(next) {
    next(new Error("Audit records are append-only"));
  }
);

// Indexes for efficient querying
auditLogsSchema.index({ createdAt: -1 }); // Most recent first
auditLogsSchema.index({ requestId: 1, createdAt: -1 }); // Trace one request across events
auditLogsSchema.index({ actor_id: 1, createdAt: -1 }); // By actor
auditLogsSchema.index({ action_type: 1, createdAt: -1 }); // By action type
auditLogsSchema.index({ entity_type: 1, entity_id: 1, createdAt: -1 }); // By affected entity
auditLogsSchema.index({ status: 1, createdAt: -1 }); // Flagged entries

export default mongoose.model("AuditLog", auditLogsSchema);
