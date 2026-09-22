import mongoose from "mongoose";

const evidenceCheckpointSchema = new mongoose.Schema({
  contract_id: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
  milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", default: null },
  reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "approved", "revision_requested"], required: true },
  note: { type: String, default: "", maxlength: 4000 },
  decided_at: { type: Date, default: Date.now },
}, { timestamps: true });

evidenceCheckpointSchema.index({ contract_id: 1, milestone_id: 1, createdAt: -1 });
export default mongoose.model("EvidenceCheckpoint", evidenceCheckpointSchema);
