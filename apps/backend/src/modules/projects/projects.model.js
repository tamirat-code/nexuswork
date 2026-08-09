import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    required_skills: [{ type: String }],
    category: { type: String },
    experience_level: { type: String, enum: ["entry", "intermediate", "advanced"] },
    budget: { type: Number, required: true },
    deadline: { type: Date, required: true },
    attachments: [{ url: String, filename: String }],
    status: {
      type: String,
      enum: ["open", "in_progress", "completed", "cancelled"],
      default: "open",
    },
  },
  { timestamps: true }
);

projectSchema.index({ title: "text", description: "text", required_skills: "text" });

export default mongoose.model("Project", projectSchema);