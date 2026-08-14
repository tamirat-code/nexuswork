import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    direction: { type: String, enum: ["deposit", "release", "refund", "commission"], required: true },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed"],
      default: "pending",
    },
    stripe_payment_intent_id: { type: String },
    stripe_transfer_id: { type: String },
    stripe_refund_id: { type: String },
  },
  { timestamps: true }
);

paymentSchema.index({ stripe_payment_intent_id: 1 });

export default mongoose.model("Payment", paymentSchema);