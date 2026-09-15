import mongoose from "mongoose";

export const API_PARTNER_TIERS = ["sandbox", "growth", "enterprise"];
export const API_PARTNER_STATUSES = ["active", "suspended", "revoked"];
export const API_PARTNER_SCOPES = ["talent:read", "talent:export", "webhooks:manage", "usage:read"];

const apiPartnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    organization_name: { type: String, trim: true, maxlength: 200 },
    contact_email: { type: String, required: true, trim: true, lowercase: true, maxlength: 320 },
    tier: { type: String, enum: API_PARTNER_TIERS, default: "sandbox" },
    status: { type: String, enum: API_PARTNER_STATUSES, default: "active" },
    scopes: [{ type: String, enum: API_PARTNER_SCOPES }],
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    suspended_at: { type: Date },
    suspended_reason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

apiPartnerSchema.index({ contact_email: 1 }, { unique: true });
apiPartnerSchema.index({ status: 1, tier: 1 });

export default mongoose.model("ApiPartner", apiPartnerSchema);
