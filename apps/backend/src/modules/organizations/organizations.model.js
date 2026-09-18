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
  },
  { timestamps: true }
);

organizationSchema.index({ owner_id: 1, status: 1 });
organizationSchema.index({ institution_id: 1, status: 1 });

export default mongoose.model("Organization", organizationSchema);
