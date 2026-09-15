import mongoose from "mongoose";

export const TALENT_API_CONSENT_FIELDS = ["name", "skills", "verification", "institution", "program", "bio"];

const studentProfileSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    university_id: { type: mongoose.Schema.Types.ObjectId, ref: "University" },
    enrollment_status: {
      type: String,
      enum: ["enrolled", "graduated", "on_leave", "unknown"],
      default: "unknown",
    },
    verification_status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    talent_api_consent: {
      enabled: { type: Boolean, default: false },
      fields: [{ type: String, enum: TALENT_API_CONSENT_FIELDS }],
      updated_at: { type: Date },
    },
   
    student_id_number: { type: String, trim: true, default: "" },
    program: { type: String, trim: true, default: "" },
    bio: { type: String, default: "" },
    skills: [
      {
        category: String,
        name: String,
        level: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"] },
        verification_method: {
          type: String,
          enum: ["self_declared", "assessment", "university_certified"],
          default: "self_declared",
        },
        evidence_file_id: { type: mongoose.Schema.Types.ObjectId, ref: "File" },
        course_name: { type: String, trim: true, maxlength: 200 },
        course_code: { type: String, trim: true, maxlength: 50 },
        course_completed_at: { type: Date },
        assessment_method: {
          type: String,
          enum: ["practical_assessment", "portfolio_review", "coursework_linkage"],
        },
        assessment_score: { type: Number, min: 0, max: 100 },
        assessment_notes: { type: String, trim: true, maxlength: 2000 },
        
        certified_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        certified_at: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

// A student number is unique within a university, while profiles that have
// not supplied one yet remain valid and do not collide with each other.
studentProfileSchema.index(
  { university_id: 1, student_id_number: 1 },
  {
    unique: true,
    name: "student_profiles_university_student_id_unique",
    partialFilterExpression: { student_id_number: { $type: "string", $gt: "" } },
  }
);

studentProfileSchema.index(
  { verification_status: 1, "talent_api_consent.enabled": 1, university_id: 1 },
  { name: "student_profiles_talent_api_search" }
);

export default mongoose.model("StudentProfile", studentProfileSchema);
