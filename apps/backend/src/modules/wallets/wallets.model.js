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
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);