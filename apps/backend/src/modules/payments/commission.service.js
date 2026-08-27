import Contract from "../contracts/contracts.model.js";
import Milestone from "../milestones/milestones.model.js";
import { paymentConfig } from "../../config/payment.config.js";

export async function getCompletedMilestoneCount(studentId) {
  const contractIds = await Contract.find({ student_id: studentId }).distinct("_id");
  if (!contractIds.length) return 0;
  return Milestone.countDocuments({ contract_id: { $in: contractIds }, status: "released" });
}

export async function getEffectiveCommissionRateBps(studentId) {
  const completedMilestones = await getCompletedMilestoneCount(studentId);
  const waived = completedMilestones < paymentConfig.commissionWaiverMilestoneThreshold;
  return {
    rateBps: waived ? 0 : paymentConfig.commissionRateBps,
    completedMilestones,
    waiverThreshold: paymentConfig.commissionWaiverMilestoneThreshold,
    waived,
  };
}

export async function getCommissionPreview(studentId, { amount, currency } = {}) {
  const effective = await getEffectiveCommissionRateBps(studentId);
  const preview = {
    ...effective,
    currency: String(currency || paymentConfig.currency).toLowerCase(),
    commissionAmount: null,
    studentPayout: null,
  };

  if (amount !== undefined && amount !== "") {
    const amountNumber = Number(amount);
    if (Number.isFinite(amountNumber) && amountNumber >= 0) {
      const amountMinor = Math.round(amountNumber * 100);
      const commissionMinor = Math.round(amountMinor * effective.rateBps / 10000);
      preview.commissionAmount = commissionMinor / 100;
      preview.studentPayout = (amountMinor - commissionMinor) / 100;
    }
  }

  return preview;
}
