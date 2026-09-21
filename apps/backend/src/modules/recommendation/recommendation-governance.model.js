import mongoose from "mongoose";

const recommendationEventSchema = new mongoose.Schema(
  {
    event_type: {
      type: String,
      enum: ["impression", "selection", "dismissal", "outcome"],
      required: true,
    },
    actor_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recommendation_id: { type: String, required: true },
    model_provider: { type: String, required: true },
    model_name: { type: String, required: true },
    model_version: { type: String, required: true },
    factors: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

recommendationEventSchema.index({ project_id: 1, student_id: 1, event_type: 1, createdAt: -1 });
recommendationEventSchema.index({ event_type: 1, createdAt: -1 });

const recommendationGovernanceSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    enabled_model: {
      provider: { type: String, default: "skill-overlap" },
      name: { type: String, default: "skill-overlap" },
      version: { type: String, default: "v1" },
    },
    risk_thresholds: {
      deadline_warning_hours: { type: Number, min: 1, max: 720, default: 72 },
      stale_check_in_days: { type: Number, min: 1, max: 90, default: 7 },
      max_overdue_tasks: { type: Number, min: 0, max: 100, default: 0 },
    },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const recommendationModelEvaluationSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true },
    name: { type: String, required: true },
    version: { type: String, required: true },
    evaluated_at: { type: Date, required: true },
    review_due_at: { type: Date, required: true },
    status: { type: String, enum: ["approved", "needs_review", "retired"], default: "approved" },
    sample_size: { type: Number, min: 0, default: 0 },
    methodology: { type: String, required: true, maxlength: 4000 },
    fairness_metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    notes: { type: String, maxlength: 4000, default: "" },
    reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

recommendationModelEvaluationSchema.index({ provider: 1, name: 1, version: 1, evaluated_at: -1 });

export const RecommendationEvent = mongoose.model("RecommendationEvent", recommendationEventSchema);
export const RecommendationGovernanceSettings = mongoose.model("RecommendationGovernanceSettings", recommendationGovernanceSettingsSchema);
export const RecommendationModelEvaluation = mongoose.model("RecommendationModelEvaluation", recommendationModelEvaluationSchema);
