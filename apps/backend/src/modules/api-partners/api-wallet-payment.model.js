import mongoose from "mongoose";

const apiWalletPaymentSchema = new mongoose.Schema(
  {
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: "ApiPartner", required: true },
    amount_minor: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ["etb"], default: "etb" },
    provider: { type: String, enum: ["chapa"], default: "chapa" },
    provider_payment_id: { type: String, unique: true, sparse: true },
    provider_reference: { type: String },
    checkout_url: { type: String },
    status: { type: String, enum: ["pending", "succeeded", "failed"], default: "pending" },
    provider_event_id: { type: String },
    ledger_journal_id: { type: String },
    operation_key: { type: String, required: true, unique: true },
    failure_message: { type: String },
  },
  { timestamps: true }
);

apiWalletPaymentSchema.index({ partner_id: 1, createdAt: -1 });

export default mongoose.model("ApiWalletPayment", apiWalletPaymentSchema);
