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
    chapa_bank_code: { type: String, default: null },
    chapa_account_name: { type: String, default: null },
    chapa_account_number_encrypted: { type: String, default: null },
    chapa_account_number_last4: { type: String, default: null },
    withdrawal_lock_version: { type: Number, default: 0 },
    withdrawal_lock_until: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);
