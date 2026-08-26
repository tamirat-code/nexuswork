import crypto from "node:crypto";
import Milestone from "./milestones.model.js";
import Contract from "../contracts/contracts.model.js";
import Wallet from "../wallets/wallets.model.js";
import Payment from "../payments/payments.model.js";
import Submission from "../submissions/submissions.model.js";
import { createDepositIntent, markDepositSucceeded, releaseToStudent } from "../payments/payments.service.js";
import { getChapaPayoutDestination } from "../wallets/wallets.service.js";
import { addSubmission } from "../submissions/submissions.service.js";
import { createInvoice } from "../invoices/invoices.service.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import { paymentConfig } from "../../config/payment.config.js";
import { withMongoTransaction } from "../../config/database.config.js";
import { isOrgMember } from "../clients/clients.service.js";
import { eventBus } from "../../events/index.js";
import { logger } from "../../shared/logger/logger.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../../shared/exceptions/AppError.js";
import { money, moneyFromLegacyMajorUnits, majorUnitsFromMoney } from "../../shared/money/money.js";
import { getAccountBalance, postJournal } from "../financial-ledger/financial-ledger.service.js";

async function auditMilestoneEvent({ actor, correlationId, ...event }) {
  return recordEvent({
    ...event,
    actor,
    correlationId: correlationId || crypto.randomUUID(),
  });
}

async function assertClient(contract, requestingUserId) {
  if (String(contract.client_id) === String(requestingUserId)) return;
  const allowed = await isOrgMember(contract.client_id, requestingUserId);
  if (!allowed) throw new ForbiddenError("Only the client can manage milestones");
}

export async function finalizeReleasedMilestoneAccounting(milestone, contract, releasePayment, auditContext = {}) {
  const totalMoney = Number.isSafeInteger(milestone.amount_minor)
    ? money(milestone.amount_minor, milestone.currency || paymentConfig.currency)
    : moneyFromLegacyMajorUnits(milestone.amount, milestone.currency || paymentConfig.currency, "milestone.amount");
  const payoutMinor = Math.round(totalMoney.amountMinor * (10000 - paymentConfig.commissionRateBps) / 10000);
  const commissionMinor = totalMoney.amountMinor - payoutMinor;
  const payoutMoney = money(payoutMinor, totalMoney.currency);
  const commissionMoney = money(commissionMinor, totalMoney.currency);
  const commissionAmount = majorUnitsFromMoney(commissionMoney);

  await withMongoTransaction(async (session) => {
    const postedJournal = await postJournal({
      eventType: "milestone.released",
      idempotencyKey: `milestone-released:${milestone._id}`,
      sourceType: "milestone",
      sourceId: milestone._id,
      requestId: auditContext.requestId || auditContext.correlationId || "system",
      actorId: auditContext.actor?._id || auditContext.actor?.id,
      actorRole: auditContext.actor?.role || "system",
      entries: [
        { accountBase: "escrow_liability", debitMinor: totalMoney.amountMinor, creditMinor: 0, currency: totalMoney.currency },
        { accountBase: "student_payable", ownerId: contract.student_id, debitMinor: 0, creditMinor: payoutMoney.amountMinor, currency: totalMoney.currency },
        { accountBase: "platform_revenue", debitMinor: 0, creditMinor: commissionMoney.amountMinor, currency: totalMoney.currency },
      ],
      metadata: { paymentId: releasePayment?._id, milestoneId: milestone._id },
      session,
    });

    releasePayment.status = "succeeded";
    releasePayment.processing_at = undefined;
    if (postedJournal?.journal?.transaction_id) {
      releasePayment.ledger_journal_id = postedJournal.journal.transaction_id;
      releasePayment.ledger_idempotency_key = `milestone-released:${milestone._id}`;
    }
    await releasePayment.save(session ? { session } : undefined);

    await Payment.findOneAndUpdate(
      { milestone_id: milestone._id, direction: "commission" },
      {
        $setOnInsert: {
          milestone_id: milestone._id,
          amount: commissionAmount,
          amount_minor: commissionMoney.amountMinor,
          currency: commissionMoney.currency,
          direction: "commission",
          status: "succeeded",
        },
      },
      { upsert: true, new: true, ...(session ? { session } : {}) }
    );

    milestone.status = "released";
    milestone.payout_status = "paid";
    milestone.payout_failure_reason = "";
    milestone.released_at = milestone.released_at || new Date();
    await milestone.save(session ? { session } : undefined);
  });
}

async function completeRelease(milestone, contract, requestingUserId, auditContext = {}) {
  const totalMoney = Number.isSafeInteger(milestone.amount_minor)
    ? money(milestone.amount_minor, milestone.currency || paymentConfig.currency)
    : moneyFromLegacyMajorUnits(milestone.amount, milestone.currency || paymentConfig.currency, "milestone.amount");
  const payoutMinor = Math.round(totalMoney.amountMinor * (10000 - paymentConfig.commissionRateBps) / 10000);
  const commissionMinor = totalMoney.amountMinor - payoutMinor;
  const payoutMoney = money(payoutMinor, totalMoney.currency);
  const commissionMoney = money(commissionMinor, totalMoney.currency);
  const payout = majorUnitsFromMoney(payoutMoney);
  const commissionAmount = majorUnitsFromMoney(commissionMoney);
  const studentWallet = await Wallet.findOne({ user_id: contract.student_id });
  const escrowBalance = await getAccountBalance(`escrow_liability:${totalMoney.currency}`);
  if (escrowBalance.hasEntries && escrowBalance.balanceMinor < totalMoney.amountMinor) {
    throw new ValidationError("Release exceeds the funded escrow balance");
  }
  let releasePayment;

  try {
    releasePayment = await releaseToStudent({
      milestoneId: milestone._id,
      amount: payout,
      amountMinor: payoutMoney.amountMinor,
      stripeAccountId: studentWallet?.stripe_account_id,
      chapaPayoutDestination: getChapaPayoutDestination(studentWallet),
      currency: totalMoney.currency,
      transferToStripe: true,
      auditContext,
    });

    if (releasePayment?.status !== "succeeded") {
      return {
        milestone,
        payout,
        releasePayment,
        payout_pending: true,
        payout_message: "The payout provider is still processing this transfer.",
      };
    }

    await finalizeReleasedMilestoneAccounting(milestone, contract, releasePayment, auditContext);

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
        currency: milestone.currency || paymentConfig.currency,
        lineItems: [
          {
            description: `Milestone: ${milestone.title}`,
            quantity: 1,
            unit_price: milestone.amount,
          },
        ],
        auditContext,
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

  await auditMilestoneEvent({
    actor: auditContext.actor,
    correlationId: auditContext.correlationId,
    eventType: "MILESTONE_RELEASED",
    action: "milestone.released",
    entityType: "milestone",
    entityId: milestone._id,
    previousState: "release_pending",
    newState: milestone.status,
    metadata: { payout, commissionAmount },
  });

  return { milestone, payout, releasePayment, payout_pending: false };
}

export async function createMilestone(contractId, requestingUserId, data, auditContext = {}) {
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
  const requestedMoney = moneyFromLegacyMajorUnits(requestedAmount, contract.terms.currency || paymentConfig.currency, "milestone.amount");

  if (currentTotal + requestedAmount > Number(contract.terms.total_amount)) {
    throw new ValidationError(
      `Milestone total cannot exceed the contract total of ${contract.terms.total_amount} ${contract.terms.currency}`
    );
  }

  const count = await Milestone.countDocuments({ contract_id: contractId });

  const milestone = await Milestone.create({
    contract_id: contractId,
    title: data.title,
    description: data.description || "",
    amount: requestedAmount,
    amount_minor: requestedMoney.amountMinor,
    currency: requestedMoney.currency,
    due_date: data.due_date,
    sequence: count + 1,
    status: "not_funded",
    payout_status: "not_applicable",
    max_revisions: data.max_revisions ?? 3,
  });

  await auditMilestoneEvent({
    actor: auditContext.actor,
    correlationId: auditContext.correlationId,
    eventType: "MILESTONE_CREATED",
    action: "milestone.created",
    entityType: "milestone",
    entityId: milestone._id,
    previousState: null,
    newState: milestone.status,
    metadata: { contractId },
  });
  return milestone;
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

export async function initiateFunding(milestoneId, requestingUserId, auditContext = {}) {
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

  const result = await createDepositIntent(milestone, auditContext.provider);
  if (milestone.status === "not_funded") {
    milestone.status = "funding_pending";
    await milestone.save();
    await auditMilestoneEvent({
      actor: auditContext.actor,
      correlationId: auditContext.correlationId,
      eventType: "MILESTONE_FUNDING_REQUESTED",
      action: "milestone.funding_requested",
      entityType: "milestone",
      entityId: milestone._id,
      previousState: "not_funded",
      newState: milestone.status,
    });
  }
  return result;
}

export async function confirmFunding(paymentIntentId, requestingUserId = null, auditContext = {}) {
  const payment = await markDepositSucceeded(paymentIntentId, auditContext);
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
    const previousState = milestone.status;
    milestone.status = "funded";
    milestone.funded_at = new Date();
    await milestone.save();
    await auditMilestoneEvent({
      actor: auditContext.actor,
      correlationId: auditContext.correlationId,
      eventType: "MILESTONE_FUNDED",
      action: "milestone.funded",
      entityType: "milestone",
      entityId: milestone._id,
      previousState,
      newState: milestone.status,
      metadata: { paymentIntentId },
    });
  }

  return milestone;
}

export async function startWork(milestoneId, requestingUserId, auditContext = {}) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");

  const contract = milestone.contract_id;

  if (String(contract.student_id) !== String(requestingUserId)) {
    throw new ForbiddenError("Only the assigned student can start work");
  }

  if (milestone.status !== "funded") {
    throw new ValidationError("Milestone must be funded before work can start");
  }

  const previousState = milestone.status;
  milestone.status = "in_progress";
  await milestone.save();

  await auditMilestoneEvent({
    actor: auditContext.actor,
    correlationId: auditContext.correlationId,
    eventType: "MILESTONE_WORK_STARTED",
    action: "milestone.work_started",
    entityType: "milestone",
    entityId: milestone._id,
    previousState,
    newState: milestone.status,
  });

  return milestone;
}

export async function submitWork(milestoneId, requestingUserId, { file_ids = [], file_url, note } = {}, auditContext = {}) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");

  const contract = milestone.contract_id;

  if (String(contract.student_id) !== String(requestingUserId)) {
    throw new ForbiddenError("Only the assigned student can submit work");
  }

  if (!["funded", "in_progress", "revision_requested"].includes(milestone.status)) {
    throw new ValidationError("Milestone must be funded or awaiting revision before work is submitted");
  }

  const submission = await addSubmission(milestone._id, requestingUserId, { file_ids, file_url, note }, auditContext);

  const previousState = milestone.status;
  milestone.status = "submitted";
  milestone.delivered_at = new Date();
  await milestone.save();

  await auditMilestoneEvent({
    actor: auditContext.actor,
    correlationId: auditContext.correlationId,
    eventType: "MILESTONE_SUBMITTED",
    action: "milestone.work_submitted",
    entityType: "milestone",
    entityId: milestone._id,
    previousState,
    newState: milestone.status,
    metadata: { submissionId: submission._id },
  });

  eventBus.emit("milestone.delivered", {
    milestoneId: milestone._id,
    clientId: contract.client_id,
  });

  return { milestone, submission };
}

export async function approveMilestone(milestoneId, requestingUserId, auditContext = {}) {
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

  const previousState = milestone.status;
  milestone.status = "approved";
  milestone.approved_at = new Date();
  milestone.payout_status = "pending";
  await milestone.save();

  await auditMilestoneEvent({
    actor: auditContext.actor,
    correlationId: auditContext.correlationId,
    eventType: "MILESTONE_APPROVED",
    action: "milestone.approved",
    entityType: "milestone",
    entityId: milestone._id,
    previousState,
    newState: milestone.status,
  });

  return { milestone, payout_pending: true, release_required: true };
}

export async function releaseApprovedMilestone(milestoneId, requestingUserId, auditContext = {}) {
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
    const previousState = milestone.status;
    milestone.status = "release_pending";
    milestone.payout_status = "pending";
    await milestone.save();
    await auditMilestoneEvent({
      actor: auditContext.actor,
      correlationId: auditContext.correlationId,
      eventType: "MILESTONE_RELEASE_REQUESTED",
      action: "milestone.release_requested",
      entityType: "milestone",
      entityId: milestone._id,
      previousState,
      newState: milestone.status,
    });
  }

  return completeRelease(milestone, contract, requestingUserId, auditContext);
}
