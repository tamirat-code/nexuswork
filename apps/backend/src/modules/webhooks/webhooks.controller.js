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
    const already = await WebhookEvent.findOne({ event_id: event.id });
    if (already) return res.json({ received: true });
  } catch (err) {
    logger.error("[webhook] failed to check stored event:", err.message);
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
      logger.warn("[webhook] could not record event:", err.message);
    }
  } catch (err) {
    logger.error(`[webhook] error handling ${event.type}:`, err.message);
  }

  res.json({ received: true });
}