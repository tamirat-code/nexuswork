import mongoose from "mongoose";

const institutionOnboardingRequestSchema = new mongoose.Schema(
  {
    institutionName: { type: String, required: true, trim: true, maxlength: 200 },
    domain: { type: String, required: true, lowercase: true, trim: true, maxlength: 200 },
    contactName: { type: String, required: true, trim: true, maxlength: 150 },
    contactEmail: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    contactTitle: { type: String, required: true, trim: true, maxlength: 150 },
    requested_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Optional for legacy requests created before evidence was introduced.
    // New submissions are enforced by organizations.service.js.
    evidence_file_id: { type: mongoose.Schema.Types.ObjectId, ref: "File", default: null },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, maxlength: 500, default: null },
    provisioned_institution_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", default: null },
  },
  { timestamps: true }
);

institutionOnboardingRequestSchema.index({ domain: 1, status: 1 });
institutionOnboardingRequestSchema.index({ requested_by: 1, createdAt: -1 });

export default mongoose.model("InstitutionOnboardingRequest", institutionOnboardingRequestSchema);
