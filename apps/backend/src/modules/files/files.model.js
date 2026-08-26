import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    filename: { type: String, required: true },
    original_name: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    content_sha256: { type: String, match: /^[a-f0-9]{64}$/ },
    url: { type: String, required: true },
    related_type: {
      type: String,
      enum: [
        "project_attachment",
        "submission",
        "portfolio",
        "message_attachment",
        "contract",
        "verification_document",
        "staff_verification_document",
        "other",
      ],
      default: "other",
    },
    related_id: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

fileSchema.index({ owner_id: 1, createdAt: -1 });
fileSchema.index({ related_type: 1, related_id: 1, createdAt: -1 });

export default mongoose.model("File", fileSchema);
