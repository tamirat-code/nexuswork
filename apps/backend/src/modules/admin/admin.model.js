import mongoose from "mongoose";

const adminActionSchema = new mongoose.Schema(
  {
    admin_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    target_type: { type: String, default: "" },
    target_id: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

adminActionSchema.index({ admin_id: 1, createdAt: -1 });
adminActionSchema.index({ target_type: 1, target_id: 1 });

export default mongoose.model("AdminAction", adminActionSchema);