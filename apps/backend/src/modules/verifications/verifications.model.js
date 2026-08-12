import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    university_id: { type: mongoose.Schema.Types.ObjectId, ref: "University", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // For email-based verification: the domain the user claims to belong to
    email_domain: { type: String, required: true, lowercase: true, trim: true },
    // For document-based verification: uploaded proof
    document_file_id: { type: mongoose.Schema.Types.ObjectId, ref: "File" },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewed_at: { type: Date },
    rejection_reason: { type: String },
  },
  { timestamps: true }
);

verificationSchema.index({ user_id: 1, university_id: 1 }, { unique: true });
verificationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Verification", verificationSchema);