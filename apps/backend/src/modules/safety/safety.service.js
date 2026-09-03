import User from "../users/users.model.js";
import { UserBlock, UserReport } from "./safety.model.js";
import { NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

async function ensureTarget(actorId, targetId) {
  if (String(actorId) === String(targetId)) throw new ValidationError("You cannot perform this action on yourself");
  const target = await User.findById(targetId).select("_id").lean();
  if (!target) throw new NotFoundError("User not found");
}

export async function blockUser(actorId, targetId) {
  await ensureTarget(actorId, targetId);
  await UserBlock.updateOne({ blocker_id: actorId, blocked_id: targetId }, { $setOnInsert: { blocker_id: actorId, blocked_id: targetId } }, { upsert: true });
  return { blocked: true };
}

export async function unblockUser(actorId, targetId) {
  await UserBlock.deleteOne({ blocker_id: actorId, blocked_id: targetId });
  return { blocked: false };
}

export async function reportUser(actorId, targetId, reason) {
  await ensureTarget(actorId, targetId);
  const report = await UserReport.create({ reporter_id: actorId, target_user_id: targetId, reason });
  return { id: report._id, status: report.status };
}

export async function listReports({ status, limit = 50, skip = 0 } = {}) {
  const query = status ? { status } : {};
  const [reports, total] = await Promise.all([
    UserReport.find(query)
      .populate("reporter_id", "name email")
      .populate("target_user_id", "name email role status")
      .sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit)).lean(),
    UserReport.countDocuments(query),
  ]);
  return { reports, total, limit: Number(limit), skip: Number(skip) };
}

export async function reviewReport(reportId, reviewerId, status, reviewNote = "") {
  const report = await UserReport.findByIdAndUpdate(
    reportId,
    { status, reviewed_by: reviewerId, reviewed_at: new Date(), review_note: reviewNote },
    { new: true, runValidators: true }
  ).lean();
  if (!report) throw new NotFoundError("Report not found");
  return report;
}
