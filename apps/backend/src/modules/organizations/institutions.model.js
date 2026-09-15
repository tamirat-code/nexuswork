import mongoose from "mongoose";

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    domain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    verificationContact: {
      name: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
      title: { type: String, trim: true },
    },
    brandingConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    staff_admin_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["active", "suspended"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Institution", institutionSchema);
