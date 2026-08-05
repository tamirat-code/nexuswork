import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    contract_id: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    due_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["not_funded", "funded", "delivered", "approved", "disputed", "released"],
      default: "not_funded",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Milestone", milestoneSchema);
