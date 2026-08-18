import mongoose from "mongoose";

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
        
        certified_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        certified_at: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("StudentProfile", studentProfileSchema);