import mongoose from "mongoose";

const proposalSchema = new mongoose.Schema(
  {
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    price: { type: Number, required: true },
    price_minor: { type: Number, min: 0 },
    currency: { type: String, lowercase: true, trim: true },
    delivery_time_days: { type: Number, required: true },
    cover_note: { type: String, required: true },
    // Optional for legacy proposals created before CV attachments existed.
    // New submissions are enforced in proposals.service.js.
    cv_file_id: { type: mongoose.Schema.Types.ObjectId, ref: "File", default: null },
    cv_viewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    cv_viewed_at: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// one proposal per student per project
proposalSchema.index({ project_id: 1, student_id: 1 }, { unique: true });

export default mongoose.model("Proposal", proposalSchema);
