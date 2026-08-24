import Dispute from "./disputes.model.js";
import Milestone from "../milestones/milestones.model.js";
import Contract from "../contracts/contracts.model.js";
import Wallet from "../wallets/wallets.model.js";
import Message from "../messaging/messaging.model.js";
import { listForMilestone as listSubmissionsForMilestone } from "../submissions/submissions.service.js";
import { refundClient, releaseToStudent } from "../payments/payments.service.js";
import { paymentConfig } from "../../config/payment.config.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../shared/exceptions/AppError.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import crypto from "node:crypto";

const VALID_OUTCOMES = ["refund_client", "release_student", "resume_work"];

export async function openDispute(milestoneId, openedBy, reason, auditContext = {}) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");

  const contract = milestone.contract_id;
  const isParty = [String(contract.client_id), String(contract.student_id)].includes(String(openedBy));
  if (!isParty) {
    throw new ForbiddenError("Only a party to this contract can open a dispute on its milestone");
  }

  if (!["funded", "in_progress", "submitted", "delivered", "revision_requested"].includes(milestone.status)) {
    throw new ValidationError(`Cannot dispute a milestone in status ${milestone.status}`);
  }
  const preDisputeStatus = milestone.status;
  milestone.status = "disputed";
  await milestone.save();
  const dispute = await Dispute.create({ milestone_id: milestoneId, opened_by: openedBy, reason, pre_dispute_status: preDisputeStatus });
  const correlationId = auditContext.correlationId || crypto.randomUUID();
  await recordEvent({
    actor: auditContext.actor,
    eventType: "MILESTONE_DISPUTED",
    action: "milestone.disputed",
    entityType: "milestone",
    entityId: milestone._id,
    previousState: preDisputeStatus,
    newState: milestone.status,
    correlationId,
    metadata: { disputeId: dispute._id },
  });
  await recordEvent({
    actor: auditContext.actor,
    eventType: "DISPUTE_OPENED",
    action: "dispute.opened",
    entityType: "dispute",
    entityId: dispute._id,
    previousState: null,
    newState: dispute.status,
    correlationId,
    metadata: { milestoneId: milestone._id },
  });
  return dispute;
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
    listSubmissionsForMilestone(milestone._id, requestingUser._id, { allowAdmin: requestingUser.role === "admin" }),
    Message.find({ contract_id: contract._id }).sort({ createdAt: 1 }).populate({ path: "attachments" }).lean(),
  ]);

  return { dispute, milestone, contract, submissions, messages };
}

export async function resolveDispute(disputeId, { resolution_summary, outcome }, auditContext = {}) {
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

  const previousDisputeState = dispute.status;
  const previousMilestoneState = milestone.status;
  if (outcome === "refund_client") {
    await refundClient(milestone._id);
    milestone.status = "not_funded";
  } else if (outcome === "release_student") {
    const studentWallet = await Wallet.findOne({ user_id: contract.student_id });
    const payout = milestone.amount * (1 - paymentConfig.commissionRate);
    await releaseToStudent({
      milestoneId: milestone._id,
      amount: payout,
      stripeAccountId: studentWallet?.stripe_account_id,
    });
    milestone.status = "released";
  } else {
   
    milestone.status = dispute.pre_dispute_status || "funded";
  }
  await milestone.save();

  dispute.status = "resolved";
  dispute.resolution_summary = resolution_summary;
  dispute.outcome = outcome;
  dispute.resolved_at = new Date();
  await dispute.save();
  await recordEvent({
    actor: auditContext.actor,
    eventType: "DISPUTE_RESOLVED",
    action: "dispute.resolved",
    entityType: "dispute",
    entityId: dispute._id,
    previousState: previousDisputeState,
    newState: dispute.status,
    correlationId: auditContext.correlationId || crypto.randomUUID(),
    metadata: { outcome, previousMilestoneState, newMilestoneState: milestone.status },
  });
  return dispute;
}

export async function listOpen() {
  return Dispute.find({ status: { $ne: "resolved" } })
    .populate("milestone_id", "title amount status")
    .sort({ createdAt: -1 });
}


export async function listForUser(userId) {
  
  const contractIds = await Contract.distinct("_id", {
    $or: [{ client_id: userId }, { student_id: userId }],
  });

  if (!contractIds.length) return [];

  const milestoneIds = await Milestone.distinct("_id", { contract_id: { $in: contractIds } });
  if (!milestoneIds.length) return [];

  return Dispute.find({ milestone_id: { $in: milestoneIds } })
    .populate("milestone_id", "title amount status")
    .sort({ createdAt: -1 });
}
