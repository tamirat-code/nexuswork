import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 3000 },
    status: { type: String, enum: ["todo", "in_progress", "completed", "blocked"], default: "todo" },
    assignee_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    due_date: { type: Date, default: null },
    sort_order: { type: Number, default: 0, min: 0 },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    completed_at: { type: Date, default: null },
    status_history: {
      type: [
        new mongoose.Schema(
          {
            status: { type: String, enum: ["todo", "in_progress", "completed", "blocked"], required: true },
            changed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            changed_at: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

taskSchema.index({ project_id: 1, milestone_id: 1, sort_order: 1 });
taskSchema.index({ assignee_id: 1, status: 1 });

export default mongoose.model("OversightTask", taskSchema);
