import crypto from "node:crypto";
import Payment from "./payments.model.js";
import Milestone from "../milestones/milestones.model.js";
import Contract from "../contracts/contracts.model.js";
import Wallet from "../wallets/wallets.model.js";
import { paymentConfig } from "../../config/payment.config.js";
import { ValidationError } from "../../shared/exceptions/AppError.js";
import { logAction } from "../audit-logs/audit-logs.service.js";
import { money, moneyFromLegacyMajorUnits, moneyFromRecord } from "../../shared/money/money.js";
import { getPaymentProvider, paymentProvider } from "./providers/index.js";
import { getAccountBalance, postJournal } from "../financial-ledger/financial-ledger.service.js";
import { PAYMENT_STATUSES, transitionPaymentStatus } from "./payment-state.js";

async function failReleasePayment(payment, milestoneId, error, auditContext = {}) {
  payment.status = "failed";
  payment.failure_message = error.message;
  payment.processing_at = undefined;
  await payment.save();
  await logAction({
    action_type: "RELEASE_FAILED",
    eventType: "RELEASE_FAILED",
    action: "release.failed",
    actor_id: auditContext.actor?.id || auditContext.actor?._id,
    actor_role: auditContext.actor?.role || "system",
    entity_type: "milestone",
    entity_id: milestoneId,
    metadata: { amount: payment.amount, currency: payment.currency, error: error.message },
    correlationId: auditContext.correlationId || crypto.randomUUID(),
  });
}

export async function createDepositIntent(milestone, requestedProvider) {
  const milestoneMoney = Number.isSafeInteger(milestone.amount_minor)
    ? money(milestone.amount_minor, milestone.currency || paymentConfig.currency)
    : moneyFromLegacyMajorUnits(milestone.amount, milestone.currency || paymentConfig.currency, "milestone.amount");

  const existing = await Payment.findOne({
    milestone_id: milestone._id,
    direction: "deposit",
    status: { $in: ["pending", "ledger_pending", "succeeded"] },
  });

  if (existing?.status === "succeeded") {
    return { payment_intent_id: existing.provider_payment_id || existing.stripe_payment_intent_id, already_succeeded: true, provider: existing.provider };
  }

  const existingProviderId = existing?.provider_payment_id || existing?.stripe_payment_intent_id;
  if (existingProviderId) {
    const existingIntent = await getPaymentProvider(existing.provider).getPaymentIntent(existingProviderId);
    if (existingIntent.status === "pending") {
      const checkoutUrl = existing.provider_checkout_url || existingIntent.clientSecret;
      if (checkoutUrl && !existing.provider_checkout_url) {
        existing.provider_checkout_url = checkoutUrl;
        await existing.save();
      }
      if (!checkoutUrl) {
        throw new ValidationError("This payment is already pending, but its checkout link is unavailable. Start a new milestone funding attempt.");
      }
      return { client_secret: checkoutUrl, payment_intent_id: existingIntent.id, already_pending: true, provider: existing.provider };
    }
    if (existingIntent.status === "succeeded") {
      await markDepositSucceeded(existingIntent.id);
      return { payment_intent_id: existingIntent.id, already_succeeded: true };
    }
    // A local pending record can outlive a failed/cancelled provider attempt.
    // Do not reopen that checkout: the caller must receive a fresh provider
    // reference so a new payment can actually be completed.
  }

  const providerName = String(
    requestedProvider || (milestoneMoney.currency === "etb" ? "chapa" : "stripe")
  ).toLowerCase();
  if (!["stripe", "chapa"].includes(providerName)) {
    throw new ValidationError("Unsupported payment provider. Choose Stripe or Chapa.");
  }
  const provider = getPaymentProvider(providerName);
  if (providerName === "chapa" && milestoneMoney.currency !== "etb") {
    throw new ValidationError(
      `Chapa funding requires ETB, but this milestone is denominated in ${milestoneMoney.currency.toUpperCase()}. Choose Stripe or use an ETB milestone.`
    );
  }

  const intent = await provider.createPaymentIntent({
    amountMinor: milestoneMoney.amountMinor,
    currency: milestoneMoney.currency,
    metadata: { milestone_id: String(milestone._id) },
   
    idempotencyKey: providerName === "chapa"
      ? `m-${String(milestone._id).slice(-16)}-${crypto.randomBytes(6).toString("hex")}`
      : `milestone-funding-${milestone._id}`,
  });

  try {
    if (existing) {
     
      existing.amount = milestone.amount;
      existing.amount_minor = milestoneMoney.amountMinor;
      existing.currency = milestoneMoney.currency;
      existing.status = "pending";
      existing.provider = providerName;
      existing.provider_payment_id = intent.id;
      existing.provider_reference = intent.providerReference;
      existing.provider_checkout_url = intent.clientSecret;
      existing.stripe_payment_intent_id = providerName === "stripe" ? intent.id : undefined;
      existing.failure_code = undefined;
      existing.failure_message = undefined;
      existing.provider_event_id = undefined;
      await existing.save();
    } else {
      await Payment.create({
        milestone_id: milestone._id,
        amount: milestone.amount,
        amount_minor: milestoneMoney.amountMinor,
        currency: milestoneMoney.currency,
        direction: "deposit",
        status: "pending",
        provider: providerName,
        provider_payment_id: intent.id,
        provider_reference: intent.providerReference,
        provider_checkout_url: intent.clientSecret,
        ...(providerName === "stripe" ? { stripe_payment_intent_id: intent.id } : {}),
      });
    }
  } catch (err) {
    throw err;
  }

  await logAction({
    action_type: "payment_deposit_initiated",
    entity_type: "milestone",
    entity_id: milestone._id,
    details: {
      amount: milestone.amount,
      currency: milestoneMoney.currency,
      payment_intent_id: intent.id,
    },
  });

  return { client_secret: intent.clientSecret, payment_intent_id: intent.id, provider: providerName };
}

export async function markDepositSucceeded(paymentIntentId, auditContext = {}) {
  if (!paymentIntentId || !/^[A-Za-z0-9_.:-]{4,200}$/.test(String(paymentIntentId))) {
    throw new ValidationError("Invalid provider payment reference");
  }

  const payment = await Payment.findOne({
    $or: [
      { provider_payment_id: paymentIntentId },
      { provider_reference: paymentIntentId },
      { stripe_payment_intent_id: paymentIntentId },
    ],
    direction: "deposit",
  });
  if (!payment) return null;

  if (payment.status === PAYMENT_STATUSES.failed) {
    throw new ValidationError("A failed payment cannot become succeeded");
  }
  if (payment.status === PAYMENT_STATUSES.succeeded && payment.ledger_journal_id) return payment;

  
  const providerPaymentId = payment.provider_payment_id || paymentIntentId;
  const intent = await getPaymentProvider(payment.provider).getPaymentIntent(providerPaymentId);
  if (intent.status !== "succeeded") {
    if (intent.status === "failed" && payment.status !== PAYMENT_STATUSES.failed) {
      transitionPaymentStatus(payment, PAYMENT_STATUSES.failed);
      payment.failure_message = `Provider payment is not succeeded (status: ${intent.providerStatus || intent.status})`;
      payment.provider_checkout_url = undefined;
      await payment.save();
    }
    throw new ValidationError(`Provider payment is not succeeded (status: ${intent.providerStatus || intent.status})`);
  }

  if (String(intent.metadata?.milestone_id || "") !== String(payment.milestone_id)) {
    throw new ValidationError("Provider payment does not belong to this milestone");
  }

  const expectedMoney = moneyFromRecord(payment);
  if (intent.amountMinor !== expectedMoney.amountMinor) {
    throw new ValidationError("Provider payment amount does not match the milestone amount");
  }

  if (String(intent.currency).toLowerCase() !== String(expectedMoney.currency).toLowerCase()) {
    throw new ValidationError("Provider payment currency does not match the milestone currency");
  }

  if (payment.status !== PAYMENT_STATUSES.ledgerPending) {
    transitionPaymentStatus(payment, PAYMENT_STATUSES.ledgerPending);
  }
  const ledgerIdempotencyKey = payment.ledger_idempotency_key || `payment-funded:${payment._id}`;
  payment.ledger_idempotency_key = ledgerIdempotencyKey;
  payment.provider_event_id = auditContext.providerEventId || payment.provider_event_id || payment.provider_reference || providerPaymentId;
  if (intent.latestChargeId) payment.stripe_charge_id = intent.latestChargeId;
  payment.failure_message = undefined;
  await payment.save();

  const milestone = await Milestone.findById(payment.milestone_id).select("contract_id currency");
  try {
    const posted = await postJournal({
      eventType: "payment.funded",
      idempotencyKey: ledgerIdempotencyKey,
      sourceType: "payment",
      sourceId: payment._id,
      providerEventId: payment.provider_event_id,
      requestId: auditContext.requestId || auditContext.correlationId || "system",
      actorId: auditContext.actor?._id || auditContext.actor?.id,
      actorRole: auditContext.actor?.role || "system",
      entries: [
        { accountBase: "provider_clearing", debitMinor: expectedMoney.amountMinor, creditMinor: 0, currency: expectedMoney.currency },
        { accountBase: "escrow_liability", debitMinor: 0, creditMinor: expectedMoney.amountMinor, currency: expectedMoney.currency },
      ],
      metadata: { milestoneId: milestone?._id, provider: payment.provider, paymentIntentId: providerPaymentId },
    });
    payment.ledger_journal_id = String(posted.journal._id);
    transitionPaymentStatus(payment, PAYMENT_STATUSES.succeeded);
    payment.failure_message = undefined;
    await payment.save();
  } catch (error) {
    payment.failure_message = error.message;
    await payment.save();
    throw error;
  }
  await logAction({
    action_type: "payment_deposit_succeeded",
    entity_type: "milestone",
    entity_id: payment.milestone_id,
    details: {
      amount: payment.amount,
      amount_minor: payment.amount_minor,
      currency: payment.currency,
      payment_intent_id: paymentIntentId,
      ledger_journal_id: payment.ledger_journal_id,
    },
  });

  return payment;
}

export async function markDepositFailed(paymentIntentId, lastPaymentError = null) {
  const failure_code = lastPaymentError?.decline_code || lastPaymentError?.code || undefined;
  const failure_message = lastPaymentError?.message || undefined;

  const payment = await Payment.findOneAndUpdate(
    { stripe_payment_intent_id: paymentIntentId, direction: "deposit", status: { $in: ["created", "pending"] } },
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

export async function releaseToStudent({ milestoneId, amount, amountMinor, currency, stripeAccountId, chapaPayoutDestination, transferToStripe = true, auditContext = {} }) {
  if (!transferToStripe) throw new ValidationError("Milestone release must use a configured payout provider");
  const releaseMoney = Number.isSafeInteger(amountMinor)
    ? money(amountMinor, currency || paymentConfig.currency)
    : moneyFromLegacyMajorUnits(amount, currency || paymentConfig.currency, "release.amount");
  const providerName = releaseMoney.currency === "etb" ? "chapa" : "stripe";
  const provider = getPaymentProvider(providerName);
  const depositPayment = providerName === "stripe"
    ? await Payment.findOne({ milestone_id: milestoneId, direction: "deposit", status: "succeeded" })
        .select("provider_payment_id stripe_payment_intent_id stripe_charge_id")
    : null;
  if (depositPayment && !depositPayment.stripe_charge_id) {
    const paymentIntentId = depositPayment.provider_payment_id || depositPayment.stripe_payment_intent_id;
    if (paymentIntentId) {
      // A charge ID lets Stripe use the original charge as the transfer
      // source, but it is not required when the platform has available
      // balance. Do not block a release if the provider cannot look up an
      // optional legacy payment reference; the transfer call below remains
      // authoritative and idempotent.
      try {
        const depositIntent = await provider.getPaymentIntent(paymentIntentId);
        if (depositIntent?.latestChargeId) {
          depositPayment.stripe_charge_id = depositIntent.latestChargeId;
          await depositPayment.save();
        }
      } catch {
        // Continue without source_transaction. This also supports deposits
        // created by older integrations that have no retrievable intent.
      }
    }
  }

  let payment = await Payment.findOne({
    milestone_id: milestoneId,
    direction: "release",
    status: { $in: ["pending", "succeeded"] },
  });

  if (payment?.status === "succeeded") return payment;

  if (!payment) {
    payment = await Payment.findOneAndUpdate(
      { milestone_id: milestoneId, direction: "release", status: "failed" },
      {
        $set: {
          status: "pending",
          amount,
          amount_minor: releaseMoney.amountMinor,
          currency: releaseMoney.currency,
          provider: providerName,
          provider_operation_key: `milestone-release-${milestoneId}`,
          stripe_account_id: stripeAccountId,
          processing_at: new Date(),
          failure_message: undefined,
        },
      },
      { new: true }
    );
  }

  if (!payment) {
    try {
      payment = await Payment.create({
        milestone_id: milestoneId,
        amount,
        amount_minor: releaseMoney.amountMinor,
        currency: releaseMoney.currency,
        direction: "release",
        status: "pending",
        stripe_account_id: stripeAccountId,
        provider_operation_key: `milestone-release-${milestoneId}`,
        provider: providerName,
        processing_at: new Date(),
      });
    } catch (err) {
      if (err.code !== 11000) throw err;
      payment = await Payment.findOne({ milestone_id: milestoneId, direction: "release", status: { $in: ["pending", "succeeded"] } });
      if (payment?.status === "succeeded") return payment;
    }
  }

  const baseOperationKey = payment.provider_operation_key || `milestone-release-${milestoneId}`;
  const sourceTransaction = depositPayment?.stripe_charge_id;
  const operationKey = sourceTransaction && !baseOperationKey.includes(`-source-${sourceTransaction}`)
    ? `${baseOperationKey}-source-${sourceTransaction}`
    : baseOperationKey;
  if (payment.provider_operation_key !== operationKey) {
    payment.provider_operation_key = operationKey;
    await payment.save();
  }
  await logAction({
    actor_id: auditContext.actor?.id || auditContext.actor?._id,
    actor_role: auditContext.actor?.role || "system",
    action_type: "RELEASE_REQUESTED",
    eventType: "RELEASE_REQUESTED",
    action: "release.requested",
    entity_type: "payment",
    entity_id: payment._id,
    metadata: { milestoneId, amount, currency: releaseMoney.currency, provider: providerName, operationKey },
    correlationId: auditContext.correlationId || crypto.randomUUID(),
  });

  if (providerName === "stripe") {
    if (!stripeAccountId) {
      const error = new ValidationError("The student's Stripe payout account has not been connected yet.");
      await failReleasePayment(payment, milestoneId, error, auditContext);
      throw error;
    }
    try {
      const account = await provider.getConnectedAccount(stripeAccountId);
      if (!account.payoutsEnabled) throw new Error("Stripe payout account is not ready");
    } catch (err) {
      const error = new ValidationError("The student's Stripe payout account could not be verified. Complete payout setup from Wallet.");
      await failReleasePayment(payment, milestoneId, error, auditContext);
      throw error;
    }
  } else if (!chapaPayoutDestination) {
    const error = new ValidationError("The student must add a verified Chapa bank payout account before ETB funds can be released.");
    await failReleasePayment(payment, milestoneId, error, auditContext);
    throw error;
  }

  let transfer;
  if (payment.provider_payment_id) {
    // A previous attempt may have reached the provider before the process
    // crashed. Verify that transfer first; never initialize a second payout.
    try {
      transfer = await provider.getTransfer(payment.provider_payment_id);
    } catch (err) {
      payment.processing_at = new Date();
      payment.status = "pending";
      payment.failure_message = `Payout status verification pending: ${err.message}`;
      await payment.save();
      return payment;
    }
  } else {
    try {
      transfer = await provider.createTransfer({
        amountMinor: releaseMoney.amountMinor,
        currency: releaseMoney.currency,
        destination: providerName === "stripe" ? stripeAccountId : chapaPayoutDestination,
        metadata: { milestone_id: String(milestoneId) },
        idempotencyKey: operationKey,
        sourceTransaction,
      });
    } catch (err) {
      await failReleasePayment(payment, milestoneId, err, auditContext);

      throw err;
    }
  }

 
  if (providerName === "chapa") {
    try {
      const verifiedTransfer = await provider.getTransfer(transfer.id);
      transfer = { ...transfer, ...verifiedTransfer };
    } catch (err) {
      payment.provider = providerName;
      payment.provider_payment_id = transfer.id;
      payment.provider_reference = transfer.providerReference;
      payment.processing_at = new Date();
      payment.status = "pending";
      payment.failure_message = `Payout status verification pending: ${err.message}`;
      await payment.save();
      return payment;
    }
  }

  payment.provider = providerName;
  payment.provider_payment_id = transfer.id;
  if (providerName === "stripe") payment.stripe_transfer_id = transfer.id;
  payment.provider_reference = transfer.providerReference;
  payment.processing_at = undefined;
  payment.failure_message = undefined;
  if (transfer.status !== "succeeded") {
    if (transfer.status === "failed") {
      const error = new ValidationError(
        `Payout provider rejected the transfer (status: ${transfer.providerStatus || transfer.status})`
      );
      await failReleasePayment(payment, milestoneId, error, auditContext);
      throw error;
    }
    payment.status = "pending";
    payment.failure_message = `Payout provider status: ${transfer.providerStatus || transfer.status}`;
    await payment.save();
    return payment;
  }
  payment.status = "succeeded";
  await payment.save();

  await logAction({
    action_type: "RELEASE_SUCCEEDED",
    eventType: "RELEASE_SUCCEEDED",
    action: "release.succeeded",
    actor_id: auditContext.actor?.id || auditContext.actor?._id,
    actor_role: auditContext.actor?.role || "system",
    entity_type: "milestone",
    entity_id: milestoneId,
    metadata: {
      amount,
      currency: releaseMoney.currency,
      provider: providerName,
      transfer_id: transfer.id,
    },
    correlationId: auditContext.correlationId || crypto.randomUUID(),
  });

  return payment;
}

export async function refundClient(milestoneId, auditContext = {}) {
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

  let payment = await Payment.findOne({
    milestone_id: milestoneId,
    direction: "refund",
    status: { $in: ["pending", "succeeded"] },
  });
  if (payment?.status === "succeeded") return payment;
  if (!payment) {
    try {
      payment = await Payment.create({
        milestone_id: milestoneId,
        amount: depositPayment.amount,
        amount_minor: moneyFromRecord(depositPayment).amountMinor,
        currency: depositPayment.currency,
        direction: "refund",
        status: "pending",
        provider_operation_key: `milestone-refund-${milestoneId}`,
        processing_at: new Date(),
      });
    } catch (err) {
      if (err.code !== 11000) throw err;
      payment = await Payment.findOne({ milestone_id: milestoneId, direction: "refund", status: { $in: ["pending", "succeeded"] } });
      if (payment?.status === "succeeded") return payment;
    }
  }

  const operationKey = payment.provider_operation_key || `milestone-refund-${milestoneId}`;
  const refundMoney = moneyFromRecord(depositPayment);
  const escrowBalance = await getAccountBalance(`escrow_liability:${refundMoney.currency}`);
  if (escrowBalance.hasEntries && escrowBalance.balanceMinor < refundMoney.amountMinor) {
    throw new ValidationError("Refund exceeds the funded escrow balance");
  }
  await logAction({
    actor_id: auditContext.actor?.id || auditContext.actor?._id,
    actor_role: auditContext.actor?.role || "system",
    action_type: "REFUND_REQUESTED",
    eventType: "REFUND_REQUESTED",
    action: "refund.requested",
    entity_type: "payment",
    entity_id: payment._id,
    metadata: { milestoneId, amount: payment.amount, currency: payment.currency, operationKey },
    correlationId: auditContext.correlationId || crypto.randomUUID(),
  });

  let refund;
  try {
    const refundProvider = getPaymentProvider(
      depositPayment.provider || (String(depositPayment.currency).toLowerCase() === "etb" ? "chapa" : "stripe")
    );
    if (refundProvider.name === "chapa") {
      throw new ValidationError("Chapa refunds are not supported by the current payout integration");
    }
    refund = await refundProvider.createRefund({
      paymentIntentId: depositPayment.provider_payment_id || depositPayment.stripe_payment_intent_id,
      idempotencyKey: operationKey,
    });
    payment.status = "succeeded";
    payment.stripe_refund_id = refund.id;
    payment.processing_at = undefined;
    payment.failure_message = undefined;
    await payment.save();
    await postJournal({
      eventType: "payment.refunded",
      idempotencyKey: `payment-refunded:${payment._id}`,
      sourceType: "payment",
      sourceId: payment._id,
      requestId: auditContext.requestId || auditContext.correlationId || "system",
      actorId: auditContext.actor?._id || auditContext.actor?.id,
      actorRole: auditContext.actor?.role || "system",
      entries: [
        { accountBase: "escrow_liability", debitMinor: refundMoney.amountMinor, creditMinor: 0, currency: refundMoney.currency },
        { accountBase: "provider_clearing", debitMinor: 0, creditMinor: refundMoney.amountMinor, currency: refundMoney.currency },
      ],
      metadata: { milestoneId, refundId: refund.id },
    });
  } catch (err) {
    payment.status = "failed";
    payment.failure_message = err.message;
    payment.processing_at = undefined;
    await payment.save();
    await logAction({
      actor_id: auditContext.actor?.id || auditContext.actor?._id,
      actor_role: auditContext.actor?.role || "system",
      action_type: "REFUND_FAILED",
      eventType: "REFUND_FAILED",
      action: "refund.failed",
      entity_type: "payment",
      entity_id: payment._id,
      metadata: { milestoneId, error: err.message },
      correlationId: auditContext.correlationId || crypto.randomUUID(),
    });
    throw err;
  }

  await logAction({
    action_type: "REFUND_SUCCEEDED",
    eventType: "REFUND_SUCCEEDED",
    action: "refund.succeeded",
    actor_id: auditContext.actor?.id || auditContext.actor?._id,
    actor_role: auditContext.actor?.role || "system",
    entity_type: "milestone",
    entity_id: milestoneId,
    metadata: {
      amount: depositPayment.amount,
      currency: paymentConfig.currency,
      refund_id: refund.id,
    },
    correlationId: auditContext.correlationId || crypto.randomUUID(),
  });

  return payment;
}

/**
 * Reconcile release payments left pending by a provider timeout or process
 * crash. Stripe idempotency makes retrying the same operation safe.
 */
export async function reconcilePendingReleases({ limit = 100, auditContext = {} } = {}) {
  const pending = await Payment.find({
    direction: "release",
    status: "pending",
  }).sort({ createdAt: 1 }).limit(Number(limit));

  const results = { checked: pending.length, succeeded: 0, failed: 0 };
  for (const payment of pending) {
    try {
      const provider = getPaymentProvider(payment.provider || (payment.currency === "etb" ? "chapa" : "stripe"));
      const providerTransferId = payment.provider_payment_id || payment.stripe_transfer_id;
      if (providerTransferId) {
        const transfer = await provider.getTransfer(providerTransferId);
        if (transfer.status !== "succeeded") {
          if (transfer.status === "failed") {
            throw new ValidationError(
              `Payout provider rejected the transfer (status: ${transfer.providerStatus || transfer.status})`
            );
          }
          continue;
        }
        payment.status = "succeeded";
        payment.processing_at = undefined;
        await payment.save();
      } else {
        await releaseToStudent({
          milestoneId: payment.milestone_id,
          amount: payment.amount,
          amountMinor: payment.amount_minor,
          currency: payment.currency,
          stripeAccountId: payment.stripe_account_id,
          auditContext,
        });
      }

      await Milestone.updateOne(
        { _id: payment.milestone_id, status: { $in: ["release_pending", "release_failed"] } },
        {
          $set: {
            status: "released",
            payout_status: "paid",
            payout_failure_reason: "",
            released_at: new Date(),
          },
        }
      );
      await logAction({
        action_type: "RELEASE_SUCCEEDED",
        eventType: "RELEASE_SUCCEEDED",
        action: "release.succeeded",
        entity_type: "milestone",
        entity_id: payment.milestone_id,
        metadata: { amount: payment.amount, currency: payment.currency, transfer_id: payment.stripe_transfer_id },
        correlationId: auditContext.correlationId || crypto.randomUUID(),
      });
      results.succeeded += 1;
    } catch (err) {
      results.failed += 1;
      await Payment.updateOne(
        { _id: payment._id, status: "pending" },
        { $set: { status: "failed", failure_message: err.message, processing_at: undefined } }
      );
      await logAction({
        action_type: "RELEASE_FAILED",
        eventType: "RELEASE_FAILED",
        action: "release.failed",
        entity_type: "milestone",
        entity_id: payment.milestone_id,
        metadata: { amount: payment.amount, currency: payment.currency, error: err.message },
        correlationId: auditContext.correlationId || crypto.randomUUID(),
      });
    }
  }

  return results;
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
