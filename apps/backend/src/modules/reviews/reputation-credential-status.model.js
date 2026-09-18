import mongoose from "mongoose";

const reputationCredentialStatusSchema = new mongoose.Schema(
  {
    credential_id: { type: String, required: true, unique: true, index: true },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["active", "revoked", "superseded"], required: true, default: "active" },
    reason: { type: String, trim: true, maxlength: 500 },
    changed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changed_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("ReputationCredentialStatus", reputationCredentialStatusSchema);
