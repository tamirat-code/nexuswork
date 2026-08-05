import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", required: true },
    version: { type: Number, required: true },
    file_url: { type: String },
    note: { type: String },
    review_status: {
      type: String,
      enum: ["pending_review", "revision_requested", "approved"],
      default: "pending_review",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Submission", submissionSchema);
