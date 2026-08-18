import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    university_id: { type: mongoose.Schema.Types.ObjectId, ref: "University", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    
    email_domain: { type: String, required: true, lowercase: true, trim: true },
    // Whether email_domain matched the university's registered domain at submission time.
    email_domain_matched: { type: Boolean, default: false },

    // Identity/enrollment evidence supplied by the student, as declared on submission.
    full_name: { type: String, required: true, trim: true },
    student_id_number: { type: String, required: true, trim: true },
    program: { type: String, required: true, trim: true },

    // Uploaded proof (student ID card, enrollment letter, transcript, etc.) — required.
    document_file_id: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },

    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewed_at: { type: Date },
    rejection_reason: { type: String },
  },
  { timestamps: true }
);

verificationSchema.index({ user_id: 1, university_id: 1 }, { unique: true });
verificationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Verification", verificationSchema);