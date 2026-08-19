import mongoose from "mongoose";


const auditLogsSchema = new mongoose.Schema(
  {
    
    actor_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actor_role: { type: String, enum: ["admin", "moderator", "university_staff", "system"], default: "system" },
    action_type: {
      type: String,
      enum: [
        "user_suspended",
        "user_restored",
        "user_deleted",
        "dispute_resolved",
        "payment_reversed",
        "payment_adjusted",
        "contract_terminated",
        "verification_approved",
        "verification_rejected",
        "user_role_changed",
        "commission_adjusted",
        "content_removed",
        "fraud_reported",
        "login_via_admin",
        "settings_changed",
        // Financial / escrow lifecycle events (system-triggered, no human actor)
        "payment_deposit_initiated",
        "payment_deposit_succeeded",
        "payment_deposit_failed",
        "payment_released",
        "payment_release_failed",
        "payment_refunded",
        "payment_commission_recorded",
        "milestone_work_submitted",
        "milestone_revision_requested",
      ],
      required: true,
    },
    entity_type: {
      type: String,
      enum: ["user", "contract", "dispute", "payment", "verification", "project", "proposal", "milestone", "submission"],
      required: true,
    },
    entity_id: { type: mongoose.Schema.Types.ObjectId },
    related_entity_type: { type: String },
    related_entity_id: { type: mongoose.Schema.Types.ObjectId },
    reason: { type: String }, // Why the action was taken
    details: { type: mongoose.Schema.Types.Mixed }, // Additional structured data (e.g., before/after values)
    ip_address: { type: String }, // For security tracking
    user_agent: { type: String }, // For security tracking
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

// Indexes for efficient querying
auditLogsSchema.index({ createdAt: -1 }); // Most recent first
auditLogsSchema.index({ actor_id: 1, createdAt: -1 }); // By actor
auditLogsSchema.index({ action_type: 1, createdAt: -1 }); // By action type
auditLogsSchema.index({ entity_type: 1, entity_id: 1, createdAt: -1 }); // By affected entity
auditLogsSchema.index({ status: 1, createdAt: -1 }); // Flagged entries

export default mongoose.model("AuditLog", auditLogsSchema);