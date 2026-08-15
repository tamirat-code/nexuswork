import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
  {
    proposal_id: { type: mongoose.Schema.Types.ObjectId, ref: "Proposal", required: true },
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending_signature", "active", "completed", "terminated"],
      default: "pending_signature",
    },
    
    client_signed_at: { type: Date },
    student_signed_at: { type: Date },
   
    signed_at: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Contract", contractSchema);