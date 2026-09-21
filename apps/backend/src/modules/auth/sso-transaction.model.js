import mongoose from "mongoose";

const ssoTransactionSchema = new mongoose.Schema({
  state: { type: String, required: true, unique: true, immutable: true },
  nonce: { type: String, required: true, immutable: true },
  code_verifier: { type: String, required: true, immutable: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, immutable: true },
  purpose: { type: String, enum: ["login", "link"], default: "login", immutable: true },
  initiated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, immutable: true },
  consumed_at: { type: Date, default: null },
  expires_at: { type: Date, required: true, expires: 600 },
}, { timestamps: true });

export default mongoose.model("SsoTransaction", ssoTransactionSchema);
