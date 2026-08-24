import Milestone from "./milestones.model.js";
import Contract from "../contracts/contracts.model.js";
import Wallet from "../wallets/wallets.model.js";
import Payment from "../payments/payments.model.js";
import Submission from "../submissions/submissions.model.js";
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

async function completeRelease(milestone, contract, requestingUserId) {
  const payout = milestone.amount * (1 - paymentConfig.commissionRate);
  const commissionAmount = milestone.amount - payout;
  const studentWallet = await Wallet.findOne({ user_id: contract.student_id });

  try {
    const releasePayment = await releaseToStudent({
      milestoneId: milestone._id,
      amount: payout,
      stripeAccountId: studentWallet?.stripe_account_id,
      transferToStripe: true,
    });

    await Payment.findOneAndUpdate(
      { milestone_id: milestone._id, direction: "commission" },
      {
        $setOnInsert: {
          milestone_id: milestone._id,
          amount: commissionAmount,
          currency: paymentConfig.currency,
          direction: "commission",
          status: "succeeded",
        },
      },
      { upsert: true, new: true }
    );

    milestone.status = "released";
    milestone.payout_status = "paid";
    milestone.payout_failure_reason = "";
    milestone.released_at = new Date();
    await milestone.save();

    // A contract is "finished" once every one of its milestones has been
    // released — nothing else ever moves it out of "active", so without
    // this the "completed" status is unreachable and features gated on it
    // (e.g. leaving a review) never activate.
    if (contract.status === "active") {
      const outstanding = await Milestone.countDocuments({
        contract_id: contract._id,
        status: { $ne: "released" },
      });
      if (outstanding === 0) {
        contract.status = "completed";
        await contract.save();
      }
    }

    eventBus.emit("milestone.released", {
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
        lineItems: [
          {
            description: `Milestone: ${milestone.title}`,
            quantity: 1,
            unit_price: milestone.amount,
          },
        ],
      });

      invoice.status = "paid";
      invoice.paid_at = new Date();
      await invoice.save();
    } catch (err) {
      logger.error(
        `[milestones] failed to auto-create invoice for milestone ${milestone._id}:`,
        err.message
      );
    }

    return { milestone, payout, releasePayment, payout_pending: false };
  } catch (err) {
    milestone.status = "release_failed";
    milestone.payout_status = "failed";
    milestone.payout_failure_reason = err.message;
    await milestone.save();

    return {
      milestone,
      payout,
      releasePayment: null,
      payout_pending: true,
      payout_message: err.message,
    };
  }
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
    payout_status: "not_applicable",
    max_revisions: data.max_revisions ?? 3,
  });
}

export async function listForContract(contractId, requestingUserId, { limit = 100, skip = 0 } = {}) {
  const contract = await Contract.findById(contractId).select("client_id student_id");
  if (!contract) throw new NotFoundError("Contract not found");
  if (![String(contract.client_id), String(contract.student_id)].includes(String(requestingUserId))) {
    const allowed = await isOrgMember(contract.client_id, requestingUserId);
    if (!allowed) throw new ForbiddenError("You are not a party to this contract");
  }

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

export async function getById(id, requestingUserId) {
  const milestone = await Milestone.findById(id);
  if (!milestone) throw new NotFoundError("Milestone not found");
  const contract = await Contract.findById(milestone.contract_id).select("client_id student_id");
  if (!contract) throw new NotFoundError("Contract not found");
  if (![String(contract.client_id), String(contract.student_id)].includes(String(requestingUserId))) {
    const allowed = await isOrgMember(contract.client_id, requestingUserId);
    if (!allowed) throw new ForbiddenError("You are not a party to this contract");
  }
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

  if (!["not_funded", "funding_pending"].includes(milestone.status)) {
    throw new ValidationError(`Cannot fund a milestone in status ${milestone.status}`);
  }

  const result = await createDepositIntent(milestone);
  if (milestone.status === "not_funded") {
    milestone.status = "funding_pending";
    await milestone.save();
  }
  return result;
}

export async function confirmFunding(paymentIntentId, requestingUserId = null) {
  const payment = await markDepositSucceeded(paymentIntentId);
  if (!payment) return null;

  const milestone = await Milestone.findById(payment.milestone_id).populate("contract_id");
  if (!milestone) return null;

  // Browser confirmation must be authorized against the actual milestone owner.
  // Webhook processing passes no user ID because Stripe itself is the source of truth.
  if (requestingUserId) {
    await assertClient(milestone.contract_id, requestingUserId);
  }

  if (!["not_funded", "funding_pending", "funded"].includes(milestone.status)) {
    throw new ValidationError(`Cannot confirm funding for milestone in status ${milestone.status}`);
  }

  if (["not_funded", "funding_pending"].includes(milestone.status)) {
    milestone.status = "funded";
    milestone.funded_at = new Date();
    await milestone.save();
  }

  return milestone;
}

export async function startWork(milestoneId, requestingUserId) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");

  const contract = milestone.contract_id;

  if (String(contract.student_id) !== String(requestingUserId)) {
    throw new ForbiddenError("Only the assigned student can start work");
  }

  if (milestone.status !== "funded") {
    throw new ValidationError("Milestone must be funded before work can start");
  }

  milestone.status = "in_progress";
  await milestone.save();

  return milestone;
}

export async function submitWork(milestoneId, requestingUserId, { file_ids = [], file_url, note } = {}) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");

  const contract = milestone.contract_id;

  if (String(contract.student_id) !== String(requestingUserId)) {
    throw new ForbiddenError("Only the assigned student can submit work");
  }

  if (!["funded", "in_progress", "revision_requested"].includes(milestone.status)) {
    throw new ValidationError("Milestone must be funded or awaiting revision before work is submitted");
  }

  const submission = await addSubmission(milestone._id, requestingUserId, { file_ids, file_url, note });

  milestone.status = "submitted";
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

  if (!["submitted", "delivered"].includes(milestone.status)) {
    throw new ValidationError("Milestone must have submitted work before approval");
  }

  // Mark the latest submission as approved so the review flow stays consistent.
  const latest = await Submission.findOne({ milestone_id: milestone._id }).sort({ version: -1 });
  if (latest && latest.review_status === "pending_review") {
    latest.review_status = "approved";
    latest.reviewer_id = requestingUserId;
    latest.reviewed_at = new Date();
    await latest.save();
  }

  milestone.status = "approved";
  milestone.approved_at = new Date();
  milestone.payout_status = "pending";
  await milestone.save();

  return { milestone, payout_pending: true, release_required: true };
}

export async function releaseApprovedMilestone(milestoneId, requestingUserId) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");

  const contract = milestone.contract_id;
  await assertClient(contract, requestingUserId);

  if (milestone.status === "disputed") {
    throw new ValidationError("A disputed milestone cannot be released");
  }

  if (!["approved", "release_failed", "release_pending"].includes(milestone.status)) {
    throw new ValidationError("Only an approved milestone can be released");
  }

  if (milestone.payout_status === "paid") {
    return { milestone, payout_pending: false };
  }

  if (milestone.status !== "release_pending") {
    milestone.status = "release_pending";
    milestone.payout_status = "pending";
    await milestone.save();
  }

  return completeRelease(milestone, contract, requestingUserId);
}
