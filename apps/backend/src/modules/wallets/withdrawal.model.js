import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    stripe_payout_id: { type: String },
    idempotency_key: { type: String, required: true },
    processing_at: { type: Date },
    failure_reason: { type: String },
  },
  { timestamps: true }
);

withdrawalSchema.index({ stripe_payout_id: 1 }, { unique: true, sparse: true });
withdrawalSchema.index(
  { user_id: 1, idempotency_key: 1 },
  { unique: true, name: "withdrawals_user_id_idempotency_key_unique" }
);

export default mongoose.model("Withdrawal", withdrawalSchema);
