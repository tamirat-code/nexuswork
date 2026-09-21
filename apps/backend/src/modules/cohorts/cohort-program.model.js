import mongoose from "mongoose";

const cohortProgramSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  institution_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", default: null },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  seats: { type: Number, required: true, min: 1, max: 10000 },
  accepted_count: { type: Number, default: 0, min: 0 },
  skill_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
  skill_names: [{ type: String }],
  application_deadline: { type: Date, required: true },
  shared_terms: {
    description: { type: String, required: true, trim: true },
    total_amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, default: "USD" },
    delivery_time_days: { type: Number, required: true, min: 1 },
    milestone_title: { type: String, default: "Cohort delivery milestone" },
  },
  status: { type: String, enum: ["draft", "open", "closed", "completed"], default: "draft" },
}, { timestamps: true });

cohortProgramSchema.index({ organization_id: 1, status: 1, application_deadline: 1 });
export default mongoose.model("CohortProgram", cohortProgramSchema);
