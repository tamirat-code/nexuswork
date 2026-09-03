import mongoose from "mongoose";

const blockSchema = new mongoose.Schema({
  blocker_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  blocked_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
blockSchema.index({ blocker_id: 1, blocked_id: 1 }, { unique: true });

const reportSchema = new mongoose.Schema({
  reporter_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  target_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, trim: true, required: true, maxlength: 2000 },
  status: { type: String, enum: ["open", "reviewed", "dismissed"], default: "open" },
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewed_at: { type: Date, default: null },
  review_note: { type: String, trim: true, maxlength: 2000, default: "" },
}, { timestamps: true });
reportSchema.index({ target_user_id: 1, status: 1, createdAt: -1 });

export const UserBlock = mongoose.model("UserBlock", blockSchema);
export const UserReport = mongoose.model("UserReport", reportSchema);
