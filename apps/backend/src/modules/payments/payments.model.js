import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", required: true },
    amount: { type: Number, required: true },
    // Canonical payment-boundary value. Legacy amount remains for API/backward compatibility.
    amount_minor: { type: Number, min: 0 },
    currency: { type: String, default: "usd" },
    direction: { type: String, enum: ["deposit", "release", "refund", "commission"], required: true },
    status: {
      type: String,
      enum: ["created", "pending", "ledger_pending", "succeeded", "failed"],
      default: "pending",
    },
    stripe_payment_intent_id: { type: String },
    stripe_charge_id: { type: String },
    stripe_transfer_id: { type: String },
    stripe_refund_id: { type: String },
    provider_refund_id: { type: String },
    provider_operation_key: { type: String },
    stripe_account_id: { type: String },
    provider: { type: String, default: "stripe", enum: ["stripe", "chapa"] },
    provider_payment_id: { type: String },
    provider_reference: { type: String },
    provider_checkout_url: { type: String },
    provider_event_id: { type: String },
    ledger_journal_id: { type: String },
    ledger_idempotency_key: { type: String },
    processing_at: { type: Date },
    failure_code: { type: String },
    failure_message: { type: String },
  },
  { timestamps: true }
);

paymentSchema.index({ stripe_payment_intent_id: 1 });
paymentSchema.index({ stripe_transfer_id: 1 }, { unique: true, sparse: true });
paymentSchema.index({ stripe_refund_id: 1 }, { unique: true, sparse: true });
paymentSchema.index({ provider: 1, provider_refund_id: 1 }, { unique: true, sparse: true });
// Legacy Stripe records do not have provider_payment_id. A sparse index still
// indexes explicit null values, so use a partial index to enforce uniqueness
// only for real provider identifiers.
paymentSchema.index(
  { provider: 1, provider_payment_id: 1 },
  { unique: true, partialFilterExpression: { provider_payment_id: { $type: "string" } } }
);
paymentSchema.index(
  { provider: 1, provider_event_id: 1 },
  { unique: true, partialFilterExpression: { provider_event_id: { $type: "string" } } }
);
paymentSchema.index(
  { milestone_id: 1, direction: 1 },
  {
    unique: true,
    partialFilterExpression: {
      $or: [
        { direction: "deposit", status: { $in: ["pending", "ledger_pending", "succeeded"] } },
        { direction: "release", status: { $in: ["pending", "succeeded"] } },
        { direction: "refund", status: { $in: ["pending", "succeeded"] } },
        { direction: "commission", status: "succeeded" },
      ],
    },
  }
);

export default mongoose.model("Payment", paymentSchema);
