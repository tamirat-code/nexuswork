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
