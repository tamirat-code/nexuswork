import Dispute from "./disputes.model.js";
import Milestone from "../milestones/milestones.model.js";
import { recordPayment } from "../payments/payments.service.js";
import { credit } from "../wallets/wallets.service.js";
import { paymentConfig } from "../../config/payment.config.js";
import { NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

const VALID_OUTCOMES = ["refund_client", "release_student"];

export async function openDispute(milestoneId, openedBy) {
  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) throw new NotFoundError("Milestone not found");
  if (!["funded", "delivered"].includes(milestone.status)) {
    throw new ValidationError(`Cannot dispute a milestone in status ${milestone.status}`);
  }
  milestone.status = "disputed";
  await milestone.save();
  return Dispute.create({ milestone_id: milestoneId, opened_by: openedBy });
}

export async function resolveDispute(disputeId, { resolution_summary, outcome }) {
  if (!VALID_OUTCOMES.includes(outcome)) {
    throw new ValidationError(`outcome must be one of: ${VALID_OUTCOMES.join(", ")}`);
  }
  const dispute = await Dispute.findById(disputeId);
  if (!dispute) throw new NotFoundError("Dispute not found");
  if (dispute.status === "resolved") {
    throw new ValidationError("Dispute is already resolved");
  }

  const milestone = await Milestone.findById(dispute.milestone_id).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");
  const contract = milestone.contract_id;

  if (outcome === "refund_client") {
    await recordPayment({ milestone_id: milestone._id, amount: milestone.amount, direction: "refund" });
    await credit(contract.client_id, milestone.amount);
    milestone.status = "not_funded";
  } else {
    const payout = milestone.amount * (1 - paymentConfig.commissionRate);
    await recordPayment({ milestone_id: milestone._id, amount: payout, direction: "release" });
    await credit(contract.student_id, payout);
    milestone.status = "released";
  }
  await milestone.save();

  dispute.status = "resolved";
  dispute.resolution_summary = resolution_summary;
  await dispute.save();
  return dispute;
}

export async function listOpen() {
  return Dispute.find({ status: { $ne: "resolved" } }).sort({ createdAt: -1 });
}