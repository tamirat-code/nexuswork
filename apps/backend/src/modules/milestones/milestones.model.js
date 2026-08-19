import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    contract_id: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    amount: { type: Number, required: true, min: 0 },
    due_date: { type: Date, required: true },
    sequence: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["not_funded", "funded", "in_progress", "submitted", "delivered", "revision_requested", "approved", "disputed", "released"],
      default: "not_funded",
    },
    funded_at: { type: Date },
    started_at: { type: Date },
    delivered_at: { type: Date },
    approved_at: { type: Date },
    released_at: { type: Date },
    revision_count: { type: Number, default: 0, min: 0 },
    max_revisions: { type: Number, default: 3, min: 0, max: 20 },
    payment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  },
  { timestamps: true }
);

milestoneSchema.index({ contract_id: 1, sequence: 1 }, { unique: true });

export default mongoose.model("Milestone", milestoneSchema);