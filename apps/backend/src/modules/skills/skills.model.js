import mongoose from "mongoose";

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, default: "" },
    description: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

skillSchema.index({ name: "text", category: "text" });
skillSchema.index({ is_active: 1, name: 1 });

export default mongoose.model("Skill", skillSchema);