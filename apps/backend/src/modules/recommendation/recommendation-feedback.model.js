import mongoose from "mongoose";

const recommendationFeedbackSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    sentiment: { type: String, enum: ["useful", "not_useful"], required: true },
    reason: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true }
);

recommendationFeedbackSchema.index({ student_id: 1, project_id: 1 }, { unique: true });
recommendationFeedbackSchema.index({ student_id: 1, createdAt: -1 });

export default mongoose.model("RecommendationFeedback", recommendationFeedbackSchema);
