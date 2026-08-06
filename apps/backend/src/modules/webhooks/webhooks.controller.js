import { stripe } from "../payments/stripe.client.js";
import { paymentConfig } from "../../config/payment.config.js";
import { confirmFunding } from "../milestones/milestones.service.js";
import { markDepositFailed } from "../payments/payments.service.js";
import { markOnboardingStatus } from "../wallets/wallets.service.js";
import { logger } from "../../shared/logger/logger.js";

export async function handleStripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, paymentConfig.stripeWebhookSecret);
  } catch (err) {
    logger.error("[webhook] signature verification failed:", err.message);
    return res.status(400).send(`Webhook signature verification failed`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        await confirmFunding(intent.id);
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        await markDepositFailed(intent.id);
        break;
      }
      case "account.updated": {
        const account = event.data.object;
        const isComplete = Boolean(account.charges_enabled && account.payouts_enabled);
        await markOnboardingStatus(account.id, isComplete);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    logger.error(`[webhook] error handling ${event.type}:`, err.message);
  }

  res.json({ received: true });
}