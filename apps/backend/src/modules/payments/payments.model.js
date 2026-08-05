import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", required: true },
    amount: { type: Number, required: true },
    direction: { type: String, enum: ["deposit", "release", "refund"], required: true },
    processor_ref: { type: String },
    status: { type: String, enum: ["pending", "succeeded", "failed"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
