import mongoose from "mongoose";

const atRiskAssessmentSchema = new mongoose.Schema(
  {
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", required: true },
    status: { type: String, enum: ["not_at_risk", "at_risk"], required: true },
    factors: [{ type: mongoose.Schema.Types.Mixed }],
    evaluator_version: { type: String, required: true, default: "oversight-v1" },
    evaluated_at: { type: Date, required: true },
    recovered_at: { type: Date, default: null },
  },
  { timestamps: true }
);

atRiskAssessmentSchema.index({ milestone_id: 1 }, { unique: true });
atRiskAssessmentSchema.index({ project_id: 1, status: 1 });

export default mongoose.model("AtRiskAssessment", atRiskAssessmentSchema);
