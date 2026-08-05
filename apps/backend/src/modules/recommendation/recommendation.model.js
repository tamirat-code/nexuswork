import mongoose from "mongoose";

// Caches the last recommendation run per student so the UI has something to
// show instantly, while a fresh scoring pass can happen in the background.
const recommendationCacheSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    project_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    generated_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("RecommendationCache", recommendationCacheSchema);
