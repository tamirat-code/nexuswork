import Milestone from "./milestones.model.js";
import Contract from "../contracts/contracts.model.js";
import Wallet from "../wallets/wallets.model.js";
import Payment from "../payments/payments.model.js";
import { createDepositIntent, markDepositSucceeded, releaseToStudent } from "../payments/payments.service.js";
import { addSubmission } from "../submissions/submissions.service.js";
import { createInvoice } from "../invoices/invoices.service.js";
import { logAction } from "../audit-logs/audit-logs.service.js";
import { paymentConfig } from "../../config/payment.config.js";
import { isOrgMember } from "../clients/clients.service.js";
import { eventBus } from "../../events/index.js";
import { logger } from "../../shared/logger/logger.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../../shared/exceptions/AppError.js";

async function assertClient(contract, requestingUserId) {
  if (String(contract.client_id) === String(requestingUserId)) return;
  const allowed = await isOrgMember(contract.client_id, requestingUserId);
  if (!allowed) throw new ForbiddenError("Only the client can manage milestones");
}

export async function createMilestone(contractId, requestingUserId, data) {
  const contract = await Contract.findById(contractId);
  if (!contract) throw new NotFoundError("Contract not found");
  if (contract.status !== "active") {
    throw new ValidationError("Milestones can only be created after both parties sign the contract");
  }

  await assertClient(contract, requestingUserId);

  const existing = await Milestone.aggregate([
    { $match: { contract_id: contract._id } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const currentTotal = existing[0]?.total || 0;
  const requestedAmount = Number(data.amount);

  if (currentTotal + requestedAmount > Number(contract.terms.total_amount)) {
    throw new ValidationError(
      `Milestone total cannot exceed the contract total of ${contract.terms.total_amount} ${contract.terms.currency}`
    );
  }

  const count = await Milestone.countDocuments({ contract_id: contractId });

  return Milestone.create({
    contract_id: contractId,
    title: data.title,
    description: data.description || "",
    amount: requestedAmount,
    due_date: data.due_date,
    sequence: count + 1,
    status: "not_funded",
  });
}

export async function listForContract(contractId, { limit = 100, skip = 0 } = {}) {
  const [milestones, total] = await Promise.all([
    Milestone.find({ contract_id: contractId })
      .sort({ sequence: 1, createdAt: 1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean(),
    Milestone.countDocuments({ contract_id: contractId }),
  ]);
  return { milestones, total, limit: Number(limit), skip: Number(skip) };
}

export async function getById(id) {
  const milestone = await Milestone.findById(id);
  if (!milestone) throw new NotFoundError("Milestone not found");
  return milestone;
}

export async function initiateFunding(milestoneId, requestingUserId) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");

  const contract = milestone.contract_id;
  await assertClient(contract, requestingUserId);

  if (contract.status !== "active") {
    throw new ValidationError("Both parties must sign the contract before a milestone can be funded");
  }
  if (milestone.status !== "not_funded") {
    throw new ValidationError(`Cannot fund a milestone in status ${milestone.status}`);
  }

  return createDepositIntent(milestone);
}

export async function confirmFunding(paymentIntentId) {
  const payment = await markDepositSucceeded(paymentIntentId);
  if (!payment) return null;

  const milestone = await Milestone.findById(payment.milestone_id);
  if (!milestone) return null;

  if (milestone.status === "not_funded") {
    milestone.status = "funded";
    milestone.funded_at = new Date();
    await milestone.save();
  }

  return milestone;
}

export async function submitWork(milestoneId, requestingUserId, { file_url, note } = {}) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");

  const contract = milestone.contract_id;
  if (String(contract.student_id) !== String(requestingUserId)) {
    throw new ForbiddenError("Only the assigned student can submit work");
  }

  if (!["funded", "delivered"].includes(milestone.status)) {
    throw new ValidationError("Milestone must be funded before work is submitted");
  }

  const submission = await addSubmission(milestone._id, { file_url, note });
  milestone.status = "delivered";
  milestone.delivered_at = new Date();
  await milestone.save();

  eventBus.emit("milestone.delivered", {
    milestoneId: milestone._id,
    clientId: contract.client_id,
  });

  return { milestone, submission };
}

export async function approveMilestone(milestoneId, requestingUserId) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");

  const contract = milestone.contract_id;
  await assertClient(contract, requestingUserId);

  if (milestone.status !== "delivered") {
    throw new ValidationError("Milestone must be delivered before approval");
  }

  const studentWallet = await Wallet.findOne({ user_id: contract.student_id });
  const payout = milestone.amount * (1 - paymentConfig.commissionRate);
  const commissionAmount = milestone.amount - payout;

  let releasePayment;
  try {
    releasePayment = await releaseToStudent({
      milestoneId: milestone._id,
      amount: payout,
      stripeAccountId: studentWallet?.stripe_account_id,
    });
  } catch (err) {
    throw new ValidationError(`Failed to release funds to student: ${err.message}`);
  }

  try {
    await Payment.create({
      milestone_id: milestone._id,
      amount: commissionAmount,
      currency: paymentConfig.currency,
      direction: "commission",
      status: "succeeded",
    });

    await logAction({
      action_type: "payment_commission_recorded",
      entity_type: "milestone",
      entity_id: milestone._id,
      details: { commissionAmount, currency: paymentConfig.currency },
    });
  } catch (err) {
    logger.warn(`[milestones] failed to record commission for milestone ${milestone._id}:`, err.message);
  }

  milestone.status = "released";
  milestone.approved_at = new Date();
  milestone.released_at = new Date();
  await milestone.save();

  eventBus.emit("milestone.approved", {
    milestoneId: milestone._id,
    studentId: contract.student_id,
    payout,
  });

  try {
    const invoice = await createInvoice({
      contractId: contract._id,
      requestingUserId,
      milestoneId: milestone._id,
      amount: milestone.amount,
      lineItems: [{
        description: `Milestone: ${milestone.title}`,
        quantity: 1,
        unit_price: milestone.amount,
      }],
    });
    invoice.status = "paid";
    invoice.paid_at = new Date();
    await invoice.save();
  } catch (err) {
    logger.error(`[milestones] failed to auto-create invoice for milestone ${milestone._id}:`, err.message);
  }

  return { milestone, payout, releasePayment };
}