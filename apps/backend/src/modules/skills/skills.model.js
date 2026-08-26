import mongoose from "mongoose";

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, default: "" },
    description: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
    // Optional per-level proposal floors in integer minor units.
    proposal_price_floor_minor_by_level: {
      beginner: { type: Number, min: 0, default: 0 },
      intermediate: { type: Number, min: 0, default: 0 },
      advanced: { type: Number, min: 0, default: 0 },
      expert: { type: Number, min: 0, default: 0 },
    },
  },
  { timestamps: true }
);

skillSchema.index({ name: "text", category: "text" });
skillSchema.index({ is_active: 1, name: 1 });

export default mongoose.model("Skill", skillSchema);
