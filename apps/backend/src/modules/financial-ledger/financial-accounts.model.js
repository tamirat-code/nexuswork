import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, immutable: true },
    type: { type: String, enum: ["asset", "liability", "revenue", "expense", "equity"], required: true, immutable: true },
    currency: { type: String, required: true, lowercase: true, immutable: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", immutable: true },
    name: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.FinancialAccount || mongoose.model("FinancialAccount", accountSchema);
