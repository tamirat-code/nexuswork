import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    direction: { type: String, enum: ["deposit", "release", "refund", "commission"], required: true },
    status: {
      type: String,
      enum: ["created", "pending", "succeeded", "failed"],
      default: "pending",
    },
    stripe_payment_intent_id: { type: String },
    stripe_transfer_id: { type: String },
    stripe_refund_id: { type: String },
    provider_operation_key: { type: String },
    stripe_account_id: { type: String },
    processing_at: { type: Date },
    failure_code: { type: String },
    failure_message: { type: String },
  },
  { timestamps: true }
);

paymentSchema.index({ stripe_payment_intent_id: 1 });
paymentSchema.index({ stripe_transfer_id: 1 }, { unique: true, sparse: true });
paymentSchema.index({ stripe_refund_id: 1 }, { unique: true, sparse: true });
paymentSchema.index(
  { milestone_id: 1, direction: 1 },
  {
    unique: true,
    partialFilterExpression: {
      $or: [
        { direction: "deposit", status: { $in: ["pending", "succeeded"] } },
        { direction: "release", status: { $in: ["pending", "succeeded"] } },
        { direction: "refund", status: { $in: ["pending", "succeeded"] } },
        { direction: "commission", status: "succeeded" },
      ],
    },
  }
);

export default mongoose.model("Payment", paymentSchema);
