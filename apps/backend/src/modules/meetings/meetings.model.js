import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["host", "participant"], required: true },
  joined_at: { type: Date, default: null },
  left_at: { type: Date, default: null },
}, { _id: false });

const meetingSchema = new mongoose.Schema({
  contract_id: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
  milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", default: null },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  host_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: "", trim: true, maxlength: 2000 },
  scheduled_start: { type: Date, required: true },
  scheduled_end: { type: Date, default: null },
  status: { type: String, enum: ["scheduled", "waiting", "active", "ended", "cancelled"], default: "scheduled" },
  room_id: { type: String, required: true, unique: true, immutable: true },
  participants: { type: [participantSchema], default: [] },
  started_at: { type: Date, default: null },
  ended_at: { type: Date, default: null },
  reminder_sent_at: { type: Date, default: null },
}, { timestamps: true });

meetingSchema.index({ contract_id: 1, scheduled_start: 1 });
meetingSchema.index({ status: 1, scheduled_start: 1 });

export default mongoose.model("Meeting", meetingSchema);
