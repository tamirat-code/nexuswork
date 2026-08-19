import Milestone from "./milestones.model.js";
import Contract from "../contracts/contracts.model.js";
import Wallet from "../wallets/wallets.model.js";
import Payment from "../payments/payments.model.js";
import { createDepositIntent, markDepositSucceeded, releaseToStudent } from "../payments/payments.service.js";
import { stripe } from "../payments/stripe.client.js";
import { addSubmission } from "../submissions/submissions.service.js";
import { createInvoice } from "../invoices/invoices.service.js";
import { logAction } from "../audit-logs/audit-logs.service.js";
import { paymentConfig } from "../../config/payment.config.js";
import { isOrgMember } from "../clients/clients.service.js";
import { eventBus } from "../../events/index.js";
import { logger } from "../../shared/logger/logger.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../../shared/exceptions/AppError.js";

export async function createMilestone(contractId, requestingUserId, data) {
  const contract = await Contract.findById(contractId);
  if (!contract) throw new NotFoundError("Contract not found");
  if (String(contract.client_id) !== String(requestingUserId)) {
    const allowed = await isOrgMember(contract.client_id, requestingUserId);
    if (!allowed) throw new ForbiddenError("Only the client can define milestones");
  }
  return Milestone.create({ contract_id: contractId, ...data });
}

export async function listForContract(contractId, { limit = 100, skip = 0 } = {}) {
  const [milestones, total] = await Promise.all([
    Milestone.find({ contract_id: contractId }).sort({ createdAt: 1 }).skip(Number(skip)).limit(Number(limit)).lean(),
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
  if (String(milestone.contract_id.client_id) !== String(requestingUserId)) {
    const allowed = await isOrgMember(milestone.contract_id.client_id, requestingUserId);
    if (!allowed) throw new ForbiddenError("Only the client can fund this milestone");
  }
  if (milestone.contract_id.status !== "active") {
    throw new ValidationError("Both parties must sign the contract before a milestone can be funded");
  }
  if (milestone.status !== "not_funded") {
    throw new ValidationError(`Cannot fund a milestone in status ${milestone.status}`);
  }

  
  const existingPending = await Payment.findOne({
    milestone_id: milestoneId,
    direction: "deposit",
    status: "pending",
  }).sort({ createdAt: -1 });

  if (existingPending?.stripe_payment_intent_id) {
    try {
      const existingIntent = await stripe.paymentIntents.retrieve(existingPending.stripe_payment_intent_id);
      if (["requires_payment_method", "requires_confirmation", "requires_action"].includes(existingIntent.status)) {
        return { client_secret: existingIntent.client_secret, payment_intent_id: existingIntent.id };
      }
      // Otherwise (succeeded/canceled/etc.) it's stale — fall through and start a fresh one.
    } catch (err) {
      logger.warn(`[milestones] could not reuse PaymentIntent ${existingPending.stripe_payment_intent_id}:`, err.message);
    }
  }

  return createDepositIntent(milestone);
}

export async function confirmFunding(paymentIntentId) {
  const payment = await markDepositSucceeded(paymentIntentId);
  if (!payment) return null;
  const milestone = await Milestone.findById(payment.milestone_id).populate("contract_id");
  if (!milestone) return null;
  milestone.status = "funded";
  await milestone.save();

  eventBus.emit("milestone.funded", {
    milestoneId: milestone._id,
    studentId: milestone.contract_id.student_id,
    amount: milestone.amount,
  });

  return milestone;
}


export async function confirmFundingForMilestone(milestoneId, requestingUserId, paymentIntentId) {
  if (!paymentIntentId) throw new ValidationError("payment_intent_id is required");

  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");
  const contract = milestone.contract_id;
  if (String(contract.client_id) !== String(requestingUserId)) {
    const allowed = await isOrgMember(contract.client_id, requestingUserId);
    if (!allowed) throw new ForbiddenError("Only the client can confirm funding for this milestone");
  }

  
  const depositPayment = await Payment.findOne({
    milestone_id: milestoneId,
    direction: "deposit",
    stripe_payment_intent_id: paymentIntentId,
  });
  if (!depositPayment) {
    throw new ValidationError("That payment doesn't match this milestone's deposit");
  }

  if (milestone.status === "funded") return milestone; // already confirmed, e.g. by the webhook

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== "succeeded") {
    throw new ValidationError(`Payment is not complete yet (status: ${intent.status}). Please finish the card step.`);
  }

  return confirmFunding(paymentIntentId);
}

export async function submitWork(milestoneId, requestingUserId, { file_url, note } = {}) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");
  const contract = milestone.contract_id;
  if (String(contract.student_id) !== String(requestingUserId)) {
    throw new ForbiddenError("Only the assigned student can submit work");
  }
  if (milestone.status !== "funded") {
    throw new ValidationError("Milestone must be funded before work is submitted");
  }
  const submission = await addSubmission(milestone._id, { file_url, note });
  milestone.status = "delivered";
  await milestone.save();

  eventBus.emit("milestone.delivered", { milestoneId: milestone._id, clientId: contract.client_id });

  return { milestone, submission };
}

export async function approveMilestone(milestoneId, requestingUserId) {
  const milestone = await Milestone.findById(milestoneId).populate("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");
  const contract = milestone.contract_id;
  if (String(contract.client_id) !== String(requestingUserId)) {
    const allowed = await isOrgMember(contract.client_id, requestingUserId);
    if (!allowed) throw new ForbiddenError("Only the client can approve this milestone");
  }
  if (milestone.status !== "delivered") {
    throw new ValidationError("Milestone must be delivered before approval");
  }
  if (milestone.status === "released") {
    throw new ValidationError("Milestone has already been released");
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
    // Transfer failed; surface as validation for the client action
    throw new ValidationError(`Failed to release funds to student: ${err.message}`);
  }

  // Record commission retention as a Payment of type 'commission' for auditing
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
  await milestone.save();

  eventBus.emit("milestone.approved", { milestoneId: milestone._id, studentId: contract.student_id, payout });

  
  try {
    const invoice = await createInvoice({
      contractId: contract._id,
      requestingUserId,
      milestoneId: milestone._id,
      amount: milestone.amount,
      lineItems: [{ description: `Milestone: ${milestone.title}`, quantity: 1, unit_price: milestone.amount }],
    });
    invoice.status = "paid";
    invoice.paid_at = new Date();
    await invoice.save();
  } catch (err) {
    logger.error(`[milestones] failed to auto-create invoice for milestone ${milestone._id}:`, err.message);
  }

  return { milestone, payout, releasePayment };
}