import mongoose from "mongoose";

const cohortApplicationSchema = new mongoose.Schema({
  cohort_id: { type: mongoose.Schema.Types.ObjectId, ref: "CohortProgram", required: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected", "withdrawn"], default: "pending" },
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewed_at: { type: Date, default: null },
  contract_id: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", default: null },
}, { timestamps: true });

cohortApplicationSchema.index({ cohort_id: 1, student_id: 1 }, { unique: true });
cohortApplicationSchema.index({ organization_id: 1, status: 1, createdAt: -1 });
export default mongoose.model("CohortApplication", cohortApplicationSchema);
