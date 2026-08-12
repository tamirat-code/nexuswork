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
  },
  { timestamps: true }
);

portfolioItemSchema.index({ user_id: 1, createdAt: -1 });
portfolioItemSchema.index({ is_published: 1, createdAt: -1 });

export default mongoose.model("PortfolioItem", portfolioItemSchema);