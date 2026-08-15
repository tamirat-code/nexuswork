import mongoose from "mongoose";

const clientProfileSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    organization_name: { type: String },
    organization_type: {
      type: String,
      enum: ["individual", "company", "university_department", "ngo", "government"],
      default: "individual",
    },
    verification_status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    document_file_id: { type: mongoose.Schema.Types.ObjectId, ref: "File" },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewed_at: { type: Date },
    rejection_reason: { type: String },
    // organizational clients can designate multiple posting users under one account
    additional_posters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("ClientProfile", clientProfileSchema);