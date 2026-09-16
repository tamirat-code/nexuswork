import mongoose from "mongoose";

const checkInSchema = new mongoose.Schema(
  {
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", required: true },
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    progress: { type: Number, required: true, min: 0, max: 100 },
    summary: { type: String, required: true, trim: true, maxlength: 3000 },
    blockers: { type: String, default: "", trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

checkInSchema.index({ project_id: 1, milestone_id: 1, createdAt: -1 });
checkInSchema.index({ author_id: 1, createdAt: -1 });

export default mongoose.model("OversightCheckIn", checkInSchema);
