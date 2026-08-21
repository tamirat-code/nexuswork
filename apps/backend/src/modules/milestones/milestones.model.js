import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    contract_id: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    amount: { type: Number, required: true, min: 0 },
    due_date: { type: Date, required: true },
    sequence: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: [
        "not_funded",
        "funded",
        "in_progress",
        "submitted",
        "delivered",
        "revision_requested",
        "approved",
        "disputed",
        "released",
      ],
      default: "not_funded",
    },
    max_revisions: { type: Number, min: 0, max: 20, default: 3 },
    revision_count: { type: Number, min: 0, default: 0 },
    payout_status: {
      type: String,
      enum: ["not_applicable", "pending", "paid", "failed"],
      default: "not_applicable",
    },
    payout_failure_reason: { type: String, default: "" },
    funded_at: { type: Date },
    delivered_at: { type: Date },
    approved_at: { type: Date },
    released_at: { type: Date },
  },
  { timestamps: true }
);

milestoneSchema.index({ contract_id: 1, sequence: 1 }, { unique: true });

export default mongoose.model("Milestone", milestoneSchema);