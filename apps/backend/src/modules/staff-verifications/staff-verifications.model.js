import mongoose from "mongoose";


const staffVerificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    university_id: { type: mongoose.Schema.Types.ObjectId, ref: "University", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

   
    email_domain: { type: String, required: true, lowercase: true, trim: true },
    email_domain_matched: { type: Boolean, default: false },

   
    full_name: { type: String, required: true, trim: true },
    job_title: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },

    // Uploaded proof (staff ID, HR/offer letter, department directory page, etc.) — required.
    document_file_id: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },

    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewed_at: { type: Date },
    rejection_reason: { type: String },
  },
  { timestamps: true }
);

staffVerificationSchema.index({ user_id: 1, university_id: 1 }, { unique: true });
staffVerificationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("StaffVerification", staffVerificationSchema);