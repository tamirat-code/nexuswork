import { stripe } from "../payments/stripe.client.js";
import { paymentConfig } from "../../config/payment.config.js";
import { confirmFunding } from "../milestones/milestones.service.js";
import { markDepositFailed } from "../payments/payments.service.js";
import { markOnboardingStatus } from "../wallets/wallets.service.js";
import { logger } from "../../shared/logger/logger.js";
import WebhookEvent from "./webhookEvent.model.js";

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
    const already = await WebhookEvent.findOne({ event_id: event.id }).lean();
    if (already) return res.json({ received: true, duplicate: true });
  } catch (err) {
    // A database read failure must not be treated as an already-processed event.
    logger.error("[webhook] failed to check stored event:", err.message);
    return res.status(503).json({ success: false, message: "Webhook processing temporarily unavailable" });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await confirmFunding(event.data.object.id);
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

    try {
      await WebhookEvent.create({
        event_id: event.id,
        type: event.type,
      });
    } catch (err) {
      // Unique event_id makes concurrent Stripe deliveries safe. If another
      // worker won the race, the business operation has already completed.
      if (err.code !== 11000) throw err;
    }

    return res.json({ received: true });
  } catch (err) {
    logger.error(`[webhook] error handling ${event.type}:`, err.message, err.stack);
    // A non-2xx response tells Stripe to retry instead of permanently dropping
    // a payment event that failed because of a transient/backend error.
    return res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
}