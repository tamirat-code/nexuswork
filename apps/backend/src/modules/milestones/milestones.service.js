import Milestone from "./milestones.model.js";
import Contract from "../contracts/contracts.model.js";
import { recordPayment } from "../payments/payments.service.js";
import { credit } from "../wallets/wallets.service.js";
import { paymentConfig } from "../../config/payment.config.js";
import { addSubmission } from "../submissions/submissions.service.js";

export async function createMilestone(contractId, requestingUserId, data) {
  const contract = await Contract.findById(contractId);
  if (!contract) {
    const err = new Error("Contract not found");
    err.status = 404;
    throw err;
  }
  if (String(contract.client_id) !== String(requestingUserId)) {
    const err = new Error("Only the client can define milestones");
    err.status = 403;
    throw err;
  }
  return Milestone.create({ contract_id: contractId, ...data });
}

export async function fundMilestone(milestoneId, requestingUserId) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) {
    const err = new Error("Milestone not found");
    err.status = 404;
    throw err;
  }
  if (String(milestone.contract_id.client_id) !== String(requestingUserId)) {
    const err = new Error("Only the client can fund this milestone");
    err.status = 403;
    throw err;
  }
  if (milestone.status !== "not_funded") {
    const err = new Error(`Cannot fund a milestone in status ${milestone.status}`);
    err.status = 400;
    throw err;
  }
  await recordPayment({ milestone_id: milestone._id, amount: milestone.amount, direction: "deposit" });
  milestone.status = "funded";
  await milestone.save();
  return milestone;
}

export async function submitWork(milestoneId, requestingUserId, { file_url, note } = {}) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) {
    const err = new Error("Milestone not found");
    err.status = 404;
    throw err;
  }
  if (String(milestone.contract_id.student_id) !== String(requestingUserId)) {
    const err = new Error("Only the assigned student can submit work");
    err.status = 403;
    throw err;
  }
  if (milestone.status !== "funded") {
    const err = new Error("Milestone must be funded before work is submitted");
    err.status = 400;
    throw err;
  }
  const submission = await addSubmission(milestone._id, { file_url, note });
  milestone.status = "delivered";
  await milestone.save();
  return { milestone, submission };
}

export async function approveMilestone(milestoneId, requestingUserId) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) {
    const err = new Error("Milestone not found");
    err.status = 404;
    throw err;
  }
  const contract = milestone.contract_id;
  if (String(contract.client_id) !== String(requestingUserId)) {
    const err = new Error("Only the client can approve this milestone");
    err.status = 403;
    throw err;
  }
  if (milestone.status !== "delivered") {
    const err = new Error("Milestone must be delivered before approval");
    err.status = 400;
    throw err;
  }
  const payout = milestone.amount * (1 - paymentConfig.commissionRate);
  await recordPayment({ milestone_id: milestone._id, amount: payout, direction: "release" });
  await credit(contract.student_id, payout);
  milestone.status = "released";
  await milestone.save();
  return { milestone, payout };
}
