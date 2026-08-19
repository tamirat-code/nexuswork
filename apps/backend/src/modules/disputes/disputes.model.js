import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", required: true },
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

export default mongoose.model("Dispute", disputeSchema);