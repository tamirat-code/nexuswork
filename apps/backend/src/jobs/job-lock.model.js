import mongoose from "mongoose";

const jobLockSchema = new mongoose.Schema(
  { _id: String, owner: { type: String, required: true }, expires_at: { type: Date, required: true, index: true } },
  { versionKey: false }
);

export default mongoose.models.JobLock || mongoose.model("JobLock", jobLockSchema);
