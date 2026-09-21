import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", required: true },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    opened_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["open", "under_review", "resolved"], default: "open" },
    resolution_summary: { type: String },
   
    pre_dispute_status: { type: String, enum: ["funded", "in_progress", "submitted", "delivered", "revision_requested"], default: "funded" },
    
    resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolved_at: { type: Date },
    outcome: { type: String },
  },
  { timestamps: true }
);

disputeSchema.index({ organization_id: 1, createdAt: -1 });

export default mongoose.model("Dispute", disputeSchema);
