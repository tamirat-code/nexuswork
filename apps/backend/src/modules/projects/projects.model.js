import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    // Canonical skill references. required_skills remains as a denormalized
    // label list for backwards-compatible reads and search indexes.
    required_skill_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
    required_skills: [{ type: String }],
    category: { type: String },
    experience_level: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"] },
    budget_type: { type: String, enum: ["fixed", "range"], default: "fixed" },
    budget: { type: Number, required: true },
    budget_min: { type: Number, min: 0 },
    budget_max: { type: Number, min: 0 },
    currency: { type: String, enum: ["USD", "ETB"], default: "USD", uppercase: true, trim: true },
    deadline: { type: Date, required: true },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
    status: {
      type: String,
      enum: ["open", "in_progress", "completed", "cancelled", "expired"],
      default: "open",
    },
  },
  { timestamps: true }
);

projectSchema.index({ title: "text", description: "text", required_skills: "text" });

export default mongoose.model("Project", projectSchema);
