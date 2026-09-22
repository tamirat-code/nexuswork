import mongoose from "mongoose";

const evidenceOauthStateSchema = new mongoose.Schema({
  state: { type: String, required: true, unique: true, immutable: true },
  contract_id: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  provider: { type: String, enum: ["github", "gitlab"], required: true },
  repository: { type: String, required: true },
  expires_at: { type: Date, required: true },
  consumed_at: { type: Date, default: null },
}, { timestamps: true });

evidenceOauthStateSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("EvidenceOauthState", evidenceOauthStateSchema);
