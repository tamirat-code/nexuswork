import mongoose from "mongoose";

const skillCertificationRequestSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    university_id: { type: mongoose.Schema.Types.ObjectId, ref: "University", required: true },
    skill_name: { type: String, required: true, trim: true, maxlength: 100 },
    skill_key: { type: String, required: true, trim: true, lowercase: true },
    evidence_file_id: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    assessment_method: {
      type: String,
      enum: ["practical_assessment", "portfolio_review", "coursework_linkage"],
      required: true,
    },
    student_notes: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    assessment_score: { type: Number, min: 0, max: 100 },
    review_notes: { type: String, trim: true, maxlength: 2000 },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewed_at: { type: Date },
  },
  { timestamps: true }
);

skillCertificationRequestSchema.index({ student_id: 1, status: 1, createdAt: -1 });
skillCertificationRequestSchema.index({ university_id: 1, status: 1, createdAt: -1 });
skillCertificationRequestSchema.index(
  { student_id: 1, skill_key: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

export default mongoose.model("SkillCertificationRequest", skillCertificationRequestSchema);
