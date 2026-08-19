import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    milestone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Milestone",
      required: true,
      index: true,
    },
    version: { type: Number, required: true, min: 1 },
    file_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
    ],
    // Kept for backward compatibility with older submissions.
    file_url: { type: String },
    file_urls: [{ type: String }],
    note: { type: String, trim: true, maxlength: 5000 },
    feedback: { type: String, trim: true, maxlength: 2000 },
    revision_reason: { type: String, trim: true, maxlength: 2000 },
    reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewed_at: { type: Date },
    submitted_at: { type: Date, default: Date.now },
    supersedes_submission_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
    },
    review_status: {
      type: String,
      enum: ["pending_review", "revision_requested", "approved"],
      default: "pending_review",
      index: true,
    },
  },
  { timestamps: true }
);

submissionSchema.index({ milestone_id: 1, version: 1 }, { unique: true });
submissionSchema.index({ milestone_id: 1, createdAt: -1 });

export default mongoose.model("Submission", submissionSchema);