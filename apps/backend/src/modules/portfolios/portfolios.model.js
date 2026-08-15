import mongoose from "mongoose";

const portfolioItemSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    project_url: { type: String },
    image_url: { type: String },
    file_id: { type: mongoose.Schema.Types.ObjectId, ref: "File" },
    tags: [{ type: String }],
    is_published: { type: Boolean, default: true },
    
    milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone" },
    consent_status: {
      type: String,
      enum: ["not_required", "pending", "approved", "denied"],
      default: "not_required",
    },
    consented_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    consented_at: { type: Date },
  },
  { timestamps: true }
);

portfolioItemSchema.index({ user_id: 1, createdAt: -1 });
portfolioItemSchema.index({ is_published: 1, createdAt: -1 });
portfolioItemSchema.index({ milestone_id: 1 }, { unique: true, sparse: true });

export default mongoose.model("PortfolioItem", portfolioItemSchema);