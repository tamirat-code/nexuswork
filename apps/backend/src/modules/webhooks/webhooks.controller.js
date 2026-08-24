import { stripe } from "../payments/stripe.client.js";
import { paymentConfig } from "../../config/payment.config.js";
import { confirmFunding } from "../milestones/milestones.service.js";
import { markDepositFailed } from "../payments/payments.service.js";
import { markOnboardingStatus } from "../wallets/wallets.service.js";
import { logger } from "../../shared/logger/logger.js";
import WebhookEvent from "./webhookEvent.model.js";

const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;

export async function handleStripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      paymentConfig.stripeWebhookSecret
    );
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
