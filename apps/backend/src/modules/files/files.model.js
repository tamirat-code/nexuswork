import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    filename: { type: String, required: true }, // name on disk
    original_name: { type: String, required: true }, // name the user uploaded
    mimetype: { type: String, required: true },
    size: { type: Number, required: true }, // bytes
    url: { type: String, required: true },
    // Optional link back to whatever this file belongs to.
    related_type: {
      type: String,
      enum: ["project_attachment", "submission", "portfolio", "message_attachment", "other"],
      default: "other",
    },
    related_id: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

fileSchema.index({ owner_id: 1, createdAt: -1 });

export default mongoose.model("File", fileSchema);