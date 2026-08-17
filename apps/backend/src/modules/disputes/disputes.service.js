import Dispute from "./disputes.model.js";
import Milestone from "../milestones/milestones.model.js";
import Contract from "../contracts/contracts.model.js";
import Wallet from "../wallets/wallets.model.js";
import Message from "../messaging/messaging.model.js";
import { listForMilestone as listSubmissionsForMilestone } from "../submissions/submissions.service.js";
import { refundClient, releaseToStudent } from "../payments/payments.service.js";
import { paymentConfig } from "../../config/payment.config.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../shared/exceptions/AppError.js";

const VALID_OUTCOMES = ["refund_client", "release_student"];

export async function openDispute(milestoneId, openedBy, reason) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");

  const contract = milestone.contract_id;
  const isParty = [String(contract.client_id), String(contract.student_id)].includes(String(openedBy));
  if (!isParty) {
    throw new ForbiddenError("Only a party to this contract can open a dispute on its milestone");
  }

  if (!["funded", "delivered"].includes(milestone.status)) {
    throw new ValidationError(`Cannot dispute a milestone in status ${milestone.status}`);
  }
  milestone.status = "disputed";
  await milestone.save();
  return Dispute.create({ milestone_id: milestoneId, opened_by: openedBy, reason });
}


export async function getDisputeEvidence(disputeId, requestingUser) {
  const dispute = await Dispute.findById(disputeId).lean();
  if (!dispute) throw new NotFoundError("Dispute not found");

  const milestone = await Milestone.findById(dispute.milestone_id).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");
  const contract = milestone.contract_id;

  const requestingUserId = String(requestingUser._id);
  const isParty = [String(contract.client_id), String(contract.student_id)].includes(requestingUserId);
  if (requestingUser.role !== "admin" && !isParty) {
    throw new ForbiddenError("Not authorized to view this dispute's evidence");
  }

  const [submissions, messages] = await Promise.all([
    listSubmissionsForMilestone(milestone._id),
    Message.find({ contract_id: contract._id }).sort({ createdAt: 1 }).populate({ path: "attachments" }).lean(),
  ]);

  return { dispute, milestone, contract, submissions, messages };
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
    await refundClient(milestone._id);
    milestone.status = "not_funded";
  } else {
    const studentWallet = await Wallet.findOne({ user_id: contract.student_id });
    const payout = milestone.amount * (1 - paymentConfig.commissionRate);
    await releaseToStudent({
      milestoneId: milestone._id,
      amount: payout,
      stripeAccountId: studentWallet?.stripe_account_id,
    });
    milestone.status = "released";
  }
  await milestone.save();

  dispute.status = "resolved";
  dispute.resolution_summary = resolution_summary;
  await dispute.save();
  return dispute;
}

export async function listOpen() {
  return Dispute.find({ status: { $ne: "resolved" } })
    .populate("milestone_id", "title amount status")
    .sort({ createdAt: -1 });
}

// Disputes on contracts the requesting user is actually a party to — what a
// student or client should see, as opposed to the admin-only platform-wide
// listOpen() view.
export async function listForUser(userId) {
  const contractIds = await Contract.find({
    $or: [{ client_id: userId }, { student_id: userId }],
  }).distinct("_id");

  if (!contractIds.length) return [];

  const milestoneIds = await Milestone.find({ contract_id: { $in: contractIds } }).distinct("_id");
  if (!milestoneIds.length) return [];

  return Dispute.find({ milestone_id: { $in: milestoneIds } })
    .populate("milestone_id", "title amount status")
    .sort({ createdAt: -1 });
}