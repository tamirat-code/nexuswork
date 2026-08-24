import { stripe } from "./stripe.client.js";
import Payment from "./payments.model.js";
import Milestone from "../milestones/milestones.model.js";
import Contract from "../contracts/contracts.model.js";
import Wallet from "../wallets/wallets.model.js";
import { paymentConfig } from "../../config/payment.config.js";
import { ValidationError } from "../../shared/exceptions/AppError.js";
import { logAction } from "../audit-logs/audit-logs.service.js";

function toStripeAmount(dollars) {
  return Math.round(dollars * 100);
}

export async function createDepositIntent(milestone) {
  const existing = await Payment.findOne({
    milestone_id: milestone._id,
    direction: "deposit",
    status: { $in: ["pending", "succeeded"] },
  });

  if (existing?.status === "succeeded") {
    return { payment_intent_id: existing.stripe_payment_intent_id, already_succeeded: true };
  }

  if (existing?.stripe_payment_intent_id) {
    const existingIntent = await stripe.paymentIntents.retrieve(existing.stripe_payment_intent_id);
    if (["requires_payment_method", "requires_confirmation", "requires_action", "processing"].includes(existingIntent.status)) {
      return { client_secret: existingIntent.client_secret, payment_intent_id: existingIntent.id, already_pending: true };
    }
    if (existingIntent.status === "succeeded") {
      await markDepositSucceeded(existingIntent.id);
      return { payment_intent_id: existingIntent.id, already_succeeded: true };
    }
  }

  const intent = await stripe.paymentIntents.create({
    amount: toStripeAmount(milestone.amount),
    currency: paymentConfig.currency,
    metadata: { milestone_id: String(milestone._id) },
    capture_method: "automatic",
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
  }, { idempotencyKey: `milestone-funding-${milestone._id}` });

  try {
    await Payment.create({
      milestone_id: milestone._id,
      amount: milestone.amount,
      currency: paymentConfig.currency,
      direction: "deposit",
      status: "pending",
      stripe_payment_intent_id: intent.id,
    });
  } catch (err) {
    if (err.code !== 11000) throw err;
  }

  await logAction({
    action_type: "payment_deposit_initiated",
    entity_type: "milestone",
    entity_id: milestone._id,
    details: {
      amount: milestone.amount,
      currency: paymentConfig.currency,
      payment_intent_id: intent.id,
    },
  });

  return { client_secret: intent.client_secret, payment_intent_id: intent.id };
}

export async function markDepositSucceeded(paymentIntentId) {
  if (!paymentIntentId || !/^pi_[A-Za-z0-9_]+$/.test(String(paymentIntentId))) {
    throw new ValidationError("Invalid Stripe PaymentIntent ID");
  }

  const payment = await Payment.findOne({
    stripe_payment_intent_id: paymentIntentId,
    direction: "deposit",
  });
  if (!payment) return null;

  // Never trust the browser or webhook payload alone. Re-read the PaymentIntent
  // from Stripe and verify the exact payment our database expects.
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== "succeeded") {
    throw new ValidationError(`Stripe payment is not succeeded (status: ${intent.status})`);
  }

  if (String(intent.metadata?.milestone_id || "") !== String(payment.milestone_id)) {
    throw new ValidationError("Stripe payment does not belong to this milestone");
  }

  const expectedAmount = toStripeAmount(payment.amount);
  if (Number(intent.amount_received || intent.amount) !== expectedAmount) {
    throw new ValidationError("Stripe payment amount does not match the milestone amount");
  }

  if (String(intent.currency).toLowerCase() !== String(payment.currency).toLowerCase()) {
    throw new ValidationError("Stripe payment currency does not match the milestone currency");
  }

  const wasAlreadySucceeded = payment.status === "succeeded";
  if (!wasAlreadySucceeded) {
    payment.status = "succeeded";
    await payment.save();
  }

  if (!wasAlreadySucceeded) {
    await logAction({
      action_type: "payment_deposit_succeeded",
      entity_type: "milestone",
      entity_id: payment.milestone_id,
      details: {
        amount: payment.amount,
        currency: payment.currency,
        payment_intent_id: paymentIntentId,
      },
    });
  }

  return payment;
}

export async function markDepositFailed(paymentIntentId, lastPaymentError = null) {
  const failure_code = lastPaymentError?.decline_code || lastPaymentError?.code || undefined;
  const failure_message = lastPaymentError?.message || undefined;

  const payment = await Payment.findOneAndUpdate(
    { stripe_payment_intent_id: paymentIntentId, direction: "deposit" },
    { status: "failed", failure_code, failure_message },
    { new: true }
  );

  if (payment) {
    // A failed provider payment can only clear a funding attempt that has not
    // already succeeded. Never regress an already-funded milestone.
    await Milestone.updateOne(
      { _id: payment.milestone_id, status: "funding_pending" },
      { $set: { status: "not_funded" } }
    );

    await logAction({
      action_type: "payment_deposit_failed",
      entity_type: "milestone",
      entity_id: payment.milestone_id,
      details: {
        amount: payment.amount,
        currency: payment.currency,
        payment_intent_id: paymentIntentId,
        failure_code,
        failure_message,
      },
    });
  }

  return payment;
}

export async function releaseToStudent({ milestoneId, amount, stripeAccountId, transferToStripe = true }) {
  const existing = await Payment.findOne({
    milestone_id: milestoneId,
    direction: "release",
    status: "succeeded",
  });

  if (existing) return existing;

  // By default milestone approval only creates the student's NexusWork
  // wallet credit — no Stripe account is required for this path. The Stripe
  // transfer is performed when the student explicitly withdraws the wallet
  // balance (requestWithdrawal). Keeping transferToStripe as an explicit
  // opt-in preserves the existing Stripe release capability for any future
  // caller that still needs it.
  if (!transferToStripe) {
    let payment;
    try {
      payment = await Payment.findOneAndUpdate(
        { milestone_id: milestoneId, direction: "release", status: "succeeded" },
        {
          $setOnInsert: {
            milestone_id: milestoneId,
            amount,
            currency: paymentConfig.currency,
            direction: "release",
            status: "succeeded",
          },
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      if (err.code !== 11000) throw err;
      payment = await Payment.findOne({ milestone_id: milestoneId, direction: "release", status: "succeeded" });
    }

    if (!payment) throw new ValidationError("Unable to record milestone release");

    await logAction({
      action_type: "payment_released",
      entity_type: "milestone",
      entity_id: milestoneId,
      details: {
        amount,
        currency: paymentConfig.currency,
        wallet_credit: true,
      },
    });

    return payment;
  }

  if (!stripeAccountId) {
    throw new ValidationError(
      "The student's payout account has not been connected yet."
    );
  }

  let account;
  try {
    account = await stripe.accounts.retrieve(stripeAccountId);
  } catch (err) {
    throw new ValidationError(
      "The student's Stripe payout account could not be verified."
    );
  }

  if (!account.payouts_enabled) {
    throw new ValidationError(
      "The student's Stripe payout account is not ready yet. They must complete payout setup before funds can be released."
    );
  }

  let transfer;
  try {
    transfer = await stripe.transfers.create(
      {
        amount: toStripeAmount(amount),
        currency: paymentConfig.currency,
        destination: stripeAccountId,
        metadata: { milestone_id: String(milestoneId) },
      },
      { idempotencyKey: `milestone-release-${milestoneId}` }
    );
  } catch (err) {
    await Payment.create({
      milestone_id: milestoneId,
      amount,
      currency: paymentConfig.currency,
      direction: "release",
      status: "failed",
    });

    await logAction({
      action_type: "payment_release_failed",
      entity_type: "milestone",
      entity_id: milestoneId,
      details: {
        amount,
        currency: paymentConfig.currency,
        error: err.message,
      },
    });

    throw err;
  }

  const payment = await Payment.create({
    milestone_id: milestoneId,
    amount,
    currency: paymentConfig.currency,
    direction: "release",
    status: "succeeded",
    stripe_transfer_id: transfer.id,
  });

  await logAction({
    action_type: "payment_released",
    entity_type: "milestone",
    entity_id: milestoneId,
    details: {
      amount,
      currency: paymentConfig.currency,
      transfer_id: transfer.id,
    },
  });

  return payment;
}

export async function refundClient(milestoneId) {
  const depositPayment = await Payment.findOne({
    milestone_id: milestoneId,
    direction: "deposit",
    status: "succeeded",
  });

  if (!depositPayment) {
    throw new ValidationError(
      "No successful deposit found for this milestone to refund."
    );
  }

  const refund = await stripe.refunds.create({
    payment_intent: depositPayment.stripe_payment_intent_id,
  });

  const payment = await Payment.create({
    milestone_id: milestoneId,
    amount: depositPayment.amount,
    currency: paymentConfig.currency,
    direction: "refund",
    status: "succeeded",
    stripe_refund_id: refund.id,
  });

  await logAction({
    action_type: "payment_refunded",
    entity_type: "milestone",
    entity_id: milestoneId,
    details: {
      amount: depositPayment.amount,
      currency: paymentConfig.currency,
      refund_id: refund.id,
    },
  });

  return payment;
}

export async function listForUser(userId) {
  const contracts = await Contract.find({
    $or: [{ client_id: userId }, { student_id: userId }],
  }).select("_id");

  const contractIds = contracts.map((c) => c._id);
  const milestones = await Milestone.find({
    contract_id: { $in: contractIds },
  }).select("_id");

  const milestoneIds = milestones.map((m) => m._id);

  return Payment.find({ milestone_id: { $in: milestoneIds } })
    .sort({ createdAt: -1 })
    .limit(100);
}
