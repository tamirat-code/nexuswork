import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    currency: { type: String, default: "usd" },
    stripe_account_id: { type: String, default: null },
    stripe_onboarding_complete: { type: Boolean, default: false },
    withdrawal_lock_version: { type: Number, default: 0 },
    withdrawal_lock_until: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);