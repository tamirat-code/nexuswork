import { getPaymentProvider } from "../payments/providers/index.js";
import { confirmFunding } from "../milestones/milestones.service.js";
import { markDepositFailed } from "../payments/payments.service.js";
import { markOnboardingStatus, updateWithdrawalFromPayoutEvent } from "../wallets/wallets.service.js";
import { logger } from "../../shared/logger/logger.js";
import WebhookEvent from "./webhookEvent.model.js";
import Payment from "../payments/payments.model.js";

const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;

function chapaEventIdentity(event) {
  const eventType = String(event.event || event.type || "transaction");
  const providerId = event.id || event.reference || event.tx_ref || event.trx_ref;
  return providerId ? `chapa:${eventType}:${providerId}` : null;
}

function parseChapaPayload(req) {
  if (Buffer.isBuffer(req.body)) {
    try { return JSON.parse(req.body.toString("utf8")); } catch { return null; }
  }
  return req.body;
}

async function confirmChapaReference(reference, req, providerEventId) {
  if (!reference || !/^[A-Za-z0-9_.:-]{4,200}$/.test(String(reference))) return null;
  return confirmFunding(reference, null, {
    correlationId: req.correlationId,
    requestId: req.requestId || req.correlationId,
    providerEventId,
  });
}

export async function handleChapaCallback(req, res) {
  try {
    const reference = req.query.trx_ref || req.query.tx_ref;
    if (!reference || !/^[A-Za-z0-9_.:-]{4,200}$/.test(String(reference))) {
      return res.status(400).json({ success: false, message: "Payment reference is invalid" });
    }
    const payment = await confirmChapaReference(reference, req, reference);
    if (!payment) return res.status(404).json({ success: false, message: "Payment reference is not recognized" });
    return res.json({ received: true, status: payment.status });
  } catch (err) {
    logger.error("[chapa] callback processing failed:", err.message);
    return res.status(502).json({ success: false, message: "Payment confirmation is pending verification" });
  }
}

export async function handleChapaWebhook(req, res) {
  const payload = parseChapaPayload(req);
  if (!payload) return res.status(400).json({ success: false, message: "Malformed Chapa event" });
  try {
    const verified = getPaymentProvider("chapa").verifyWebhook(req.body, req.headers["x-chapa-signature"] || req.headers["chapa-signature"]);
    const event = Buffer.isBuffer(verified) ? payload : verified;
    const eventId = chapaEventIdentity(event);
    if (!eventId) return res.status(400).json({ success: false, message: "Chapa event has no identifier" });
    const providerTransactionId = event.tx_ref || event.trx_ref;
    const localPayment = providerTransactionId
      ? await Payment.findOne({
          provider: "chapa",
          $or: [{ provider_payment_id: providerTransactionId }, { provider_reference: providerTransactionId }],
        }).select("_id")
      : null;
    try {
      await WebhookEvent.create({
        event_id: eventId,
        provider: "chapa",
        provider_event_id: event.id || event.reference || event.tx_ref || event.trx_ref,
        provider_transaction_id: providerTransactionId,
        payment_id: localPayment?._id,
        request_id: req.requestId || req.correlationId,
        type: event.event || event.type || "transaction",
        status: "processing",
        processing_at: new Date(),
      });
    } catch (err) {
      if (err.code === 11000) {
        const staleBefore = new Date(Date.now() - PROCESSING_TIMEOUT_MS);
        const reclaimed = await WebhookEvent.findOneAndUpdate(
          { event_id: eventId, status: { $in: ["failed", "processing"] }, processing_at: { $lt: staleBefore } },
          { $set: { status: "processing", processing_at: new Date(), request_id: req.requestId || req.correlationId, payment_id: localPayment?._id }, $unset: { error_message: 1, processed_at: 1 } },
          { new: true }
        );
        if (!reclaimed) return res.json({ received: true, duplicate: true });
      } else {
        throw err;
      }
    }
    const reference = event.tx_ref || event.trx_ref;
    if (event.status === "success" || event.event === "charge.success") {
      const payment = await confirmChapaReference(reference, req, eventId);
      if (!payment) throw new Error("Chapa event references an unknown payment");
    }
    await WebhookEvent.updateOne({ event_id: eventId }, { $set: { status: "succeeded", processed_at: new Date() }, $unset: { processing_at: 1, error_message: 1 } });
    return res.json({ received: true });
  } catch (err) {
    const payload = parseChapaPayload(req);
    const eventId = payload && chapaEventIdentity(payload);
    if (eventId) await WebhookEvent.updateOne({ event_id: eventId }, { $set: { status: "failed", error_message: err.message } }).catch(() => {});
    logger.error("[chapa] webhook processing failed:", err.message);
    return res.status(400).json({ success: false, message: "Chapa webhook rejected" });
  }
}

export async function handleStripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = getPaymentProvider("stripe").verifyWebhook(req.body, signature);
  } catch (err) {
    logger.error("[webhook] signature verification failed:", err.message);
    return res.status(400).send("Webhook signature verification failed");
  }

  try {
    await WebhookEvent.create({
      event_id: event.id,
      type: event.type,
      status: "processing",
      processing_at: new Date(),
    });
  } catch (err) {
    if (err.code !== 11000) {
      logger.error("[webhook] failed to store event:", err.message);
      return res.status(503).json({ success: false, message: "Webhook processing temporarily unavailable" });
    }

    const staleBefore = new Date(Date.now() - PROCESSING_TIMEOUT_MS);
    let retry;
    try {
      retry = await WebhookEvent.findOneAndUpdate(
        {
          event_id: event.id,
          $or: [
            { status: "failed" },
            { status: "processing", processing_at: { $lt: staleBefore } },
            { status: "processing", processing_at: null, createdAt: { $lt: staleBefore } },
          ],
        },
        {
          $set: { status: "processing", processing_at: new Date(), type: event.type },
          $unset: { error_message: 1, processed_at: 1 },
        },
        { new: true }
      );
    } catch (retryError) {
      logger.error("[webhook] failed to recover stored event:", retryError.message);
      return res.status(503).json({ success: false, message: "Webhook processing temporarily unavailable" });
    }
    if (!retry) return res.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await confirmFunding(event.data.object.id, null, { correlationId: req.correlationId });
        break;

      case "payment_intent.payment_failed":
        await markDepositFailed(event.data.object.id, event.data.object.last_payment_error);
        break;

      case "account.updated": {
        const account = event.data.object;
        const isComplete = Boolean(
          account.charges_enabled && account.payouts_enabled
        );
        await markOnboardingStatus(account.id, isComplete);
        break;
      }

      case "payout.created":
      case "payout.updated":
      case "payout.paid":
      case "payout.failed":
      case "payout.canceled":
        await updateWithdrawalFromPayoutEvent(event.type, event.data.object, {
          connectedAccountId: event.account,
          correlationId: req.correlationId,
        });
        break;

      default:
        break;
    }

    await WebhookEvent.updateOne(
      { event_id: event.id },
      { $set: { status: "succeeded", processed_at: new Date() }, $unset: { processing_at: 1, error_message: 1 } }
    );

    return res.json({ received: true });
  } catch (err) {
    await WebhookEvent.updateOne(
      { event_id: event.id },
      { $set: { status: "failed", error_message: err.message } }
    ).catch(() => {});
    logger.error(`[webhook] error handling ${event.type}:`, err.message, err.stack);
    // A non-2xx response tells Stripe to retry instead of permanently dropping
    // a payment event that failed because of a transient/backend error.
    return res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
}
