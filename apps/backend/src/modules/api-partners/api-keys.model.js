import mongoose from "mongoose";
import { API_PARTNER_SCOPES } from "./api-partners.model.js";

const apiKeySchema = new mongoose.Schema(
  {
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: "ApiPartner", required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    key_prefix: { type: String, required: true, unique: true, immutable: true },
    key_hash: { type: String, required: true, unique: true, immutable: true, select: false },
    scopes: [{ type: String, enum: API_PARTNER_SCOPES }],
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    last_used_at: { type: Date },
    revoked_at: { type: Date },
    expires_at: { type: Date },
  },
  { timestamps: true }
);

apiKeySchema.index({ partner_id: 1, createdAt: -1 });
apiKeySchema.index({ partner_id: 1, revoked_at: 1 });

export default mongoose.model("ApiKey", apiKeySchema);
