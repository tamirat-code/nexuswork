import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    institution_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", default: null },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    billing_mode: { type: String, enum: ["escrow", "consolidated_invoice"], default: "escrow" },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
  },
  { timestamps: true }
);

organizationSchema.index({ owner_id: 1, status: 1 });
organizationSchema.index({ institution_id: 1, status: 1 });

export default mongoose.model("Organization", organizationSchema);
