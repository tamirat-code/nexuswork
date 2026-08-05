import Dispute from "./disputes.model.js";
import Milestone from "../milestones/milestones.model.js";

export async function openDispute(milestoneId, openedBy) {
  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) {
    const err = new Error("Milestone not found");
    err.status = 404;
    throw err;
  }
  milestone.status = "disputed";
  await milestone.save();
  return Dispute.create({ milestone_id: milestoneId, opened_by: openedBy });
}

export async function resolveDispute(disputeId, resolution_summary) {
  return Dispute.findByIdAndUpdate(disputeId, { status: "resolved", resolution_summary }, { new: true });
}

export async function listOpen() {
  return Dispute.find({ status: { $ne: "resolved" } }).sort({ createdAt: -1 });
}
