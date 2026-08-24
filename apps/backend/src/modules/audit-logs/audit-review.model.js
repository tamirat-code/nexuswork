import mongoose from "mongoose";

const auditReviewSchema = new mongoose.Schema(
  {
    audit_log_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AuditLog",
      required: true,
      unique: true,
      immutable: true,
    },
    reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    reviewer_role: { type: String, enum: ["admin", "moderator"], required: true, immutable: true },
    reason: { type: String, required: true, immutable: true },
    status: { type: String, enum: ["flagged_for_review"], default: "flagged_for_review" },
    correlationId: { type: String, required: true, immutable: true },
  },
  { timestamps: true, collection: "audit_reviews" }
);

export default mongoose.models.AuditReview || mongoose.model("AuditReview", auditReviewSchema);
