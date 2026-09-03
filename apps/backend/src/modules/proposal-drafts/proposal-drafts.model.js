import mongoose from "mongoose";

const proposalDraftSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    price: { type: Number, min: 0, default: null },
    delivery_time_days: { type: Number, min: 1, default: null },
    cover_note: { type: String, trim: true, maxlength: 10000, default: "" },
  },
  { timestamps: true }
);

proposalDraftSchema.index({ student_id: 1, project_id: 1 }, { unique: true });
export default mongoose.model("ProposalDraft", proposalDraftSchema);
