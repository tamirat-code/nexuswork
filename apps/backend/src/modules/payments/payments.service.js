import { stripe } from "./stripe.client.js";
import Payment from "./payments.model.js";
import Milestone from "../milestones/milestones.model.js";
import Contract from "../contracts/contracts.model.js";
import { paymentConfig } from "../../config/payment.config.js";
import { ValidationError } from "../../shared/exceptions/AppError.js";

function toStripeAmount(dollars) {
  return Math.round(dollars * 100);
}

export async function createDepositIntent(milestone) {
  const intent = await stripe.paymentIntents.create({
    amount: toStripeAmount(milestone.amount),
    currency: paymentConfig.currency,
    metadata: { milestone_id: String(milestone._id) },
    capture_method: "automatic",
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
  });

  await Payment.create({
    milestone_id: milestone._id,
    amount: milestone.amount,
    currency: paymentConfig.currency,
    direction: "deposit",
    status: "pending",
    stripe_payment_intent_id: intent.id,
  });

  return { client_secret: intent.client_secret, payment_intent_id: intent.id };
}
export async function markDepositSucceeded(paymentIntentId) {
  const payment = await Payment.findOneAndUpdate(
    { stripe_payment_intent_id: paymentIntentId, direction: "deposit" },
    { status: "succeeded" },
    { new: true }
  );
  return payment;
}

export async function markDepositFailed(paymentIntentId) {
  return Payment.findOneAndUpdate(
    { stripe_payment_intent_id: paymentIntentId, direction: "deposit" },
    { status: "failed" },
    { new: true }
  );
}

export async function releaseToStudent({ milestoneId, amount, stripeAccountId }) {
  if (!stripeAccountId) {
    throw new ValidationError(
      "This student hasn't completed Stripe Connect onboarding yet, so they can't receive a payout."
    );
  }
  const transfer = await stripe.transfers.create({
    amount: toStripeAmount(amount),
    currency: paymentConfig.currency,
    destination: stripeAccountId,
    metadata: { milestone_id: String(milestoneId) },
  });

  return Payment.create({
    milestone_id: milestoneId,
    amount,
    currency: paymentConfig.currency,
    direction: "release",
    status: "succeeded",
    stripe_transfer_id: transfer.id,
  });
}

export async function refundClient(milestoneId) {
  const depositPayment = await Payment.findOne({
    milestone_id: milestoneId,
    direction: "deposit",
    status: "succeeded",
  });
  if (!depositPayment) {
    throw new ValidationError("No successful deposit found for this milestone to refund.");
  }

  const refund = await stripe.refunds.create({
    payment_intent: depositPayment.stripe_payment_intent_id,
  });

  return Payment.create({
    milestone_id: milestoneId,
    amount: depositPayment.amount,
    currency: paymentConfig.currency,
    direction: "refund",
    status: "succeeded",
    stripe_refund_id: refund.id,
  });
}

export async function listForUser(userId) {
  const contracts = await Contract.find({ $or: [{ client_id: userId }, { student_id: userId }] }).select("_id");
  const contractIds = contracts.map((c) => c._id);
  const milestones = await Milestone.find({ contract_id: { $in: contractIds } }).select("_id");
  const milestoneIds = milestones.map((m) => m._id);
  return Payment.find({ milestone_id: { $in: milestoneIds } }).sort({ createdAt: -1 }).limit(100);
}