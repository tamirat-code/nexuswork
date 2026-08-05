import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    contract_id: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
    reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewee_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String },
  },
  { timestamps: true }
);

reviewSchema.index({ contract_id: 1, reviewer_id: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
