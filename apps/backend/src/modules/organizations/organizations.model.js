import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    institution_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", default: null },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    billing_mode: { type: String, enum: ["individual", "consolidated", "net_30", "escrow", "consolidated_invoice"], default: "individual" },
    net30_approved: { type: Boolean, default: false },
    net30_approved_at: { type: Date },
    net30_approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    net30_policy_version: { type: String },
    credit_limit_minor: { type: Number, min: 0, default: 0 },
    credit_used_minor: { type: Number, min: 0, default: 0 },
    overdue_since: { type: Date },
    suspended_at: { type: Date },
    suspension_reason: { type: String, maxlength: 500 },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    sso: {
      enabled: { type: Boolean, default: false },
      enforced: { type: Boolean, default: false },
      provider: { type: String, enum: ["oidc"], default: "oidc" },
      issuer: { type: String, trim: true, default: null },
      client_id: { type: String, trim: true, default: null },
      client_secret: { type: String, select: false, default: null },
      authorization_endpoint: { type: String, trim: true, default: null },
      token_endpoint: { type: String, trim: true, default: null },
      jwks_uri: { type: String, trim: true, default: null },
      allowed_domains: { type: [String], default: [] },
      role_claim: { type: String, default: "groups" },
      role_mapping: { type: mongoose.Schema.Types.Mixed, default: { admin: ["admin"], recruiter: ["recruiter"], billing_viewer: ["billing_viewer"] } },
      configured_at: { type: Date, default: null },
      configured_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
  },
  { timestamps: true }
);

organizationSchema.index({ owner_id: 1, status: 1 });
organizationSchema.index({ institution_id: 1, status: 1 });

export default mongoose.model("Organization", organizationSchema);
