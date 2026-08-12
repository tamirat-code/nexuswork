import mongoose from "mongoose";

const learningResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String },
    resource_type: {
      type: String,
      enum: ["article", "video", "course", "tutorial", "other"],
      default: "other",
    },
    url: { type: String },
    file_id: { type: mongoose.Schema.Types.ObjectId, ref: "File" },
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tags: [{ type: String }],
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "all"],
      default: "all",
    },
    is_published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

learningResourceSchema.index({ title: "text", description: "text", tags: "text" });
learningResourceSchema.index({ is_published: 1, category: 1 });

export default mongoose.model("LearningResource", learningResourceSchema);