import mongoose from "mongoose";

const savedProjectSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  },
  { timestamps: true }
);

savedProjectSchema.index({ user_id: 1, project_id: 1 }, { unique: true });
savedProjectSchema.index({ user_id: 1, createdAt: -1 });

export default mongoose.model("SavedProject", savedProjectSchema);
