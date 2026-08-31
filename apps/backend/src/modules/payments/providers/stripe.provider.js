import { stripe } from "../stripe.client.js";
import { paymentConfig } from "../../../config/payment.config.js";
import { PaymentProviderError } from "./payment-provider.js";

function normalizeError(error) {
  return new PaymentProviderError(
    error?.raw?.message || error?.message || "Payment provider request failed",
    {
      code: error?.code || error?.raw?.code,
      providerStatus: error?.statusCode || error?.raw?.statusCode,
      retryable: Boolean(error?.statusCode >= 500 || error?.type === "StripeConnectionError"),
      cause: error,
    }
  );
}

async function call(operation) {
  try {
    return await operation();
  } catch (error) {
    throw normalizeError(error);
  }
}

function paymentStatus(status) {
  if (status === "succeeded") return "succeeded";
  if (["requires_payment_method", "requires_confirmation", "requires_action", "processing"].includes(status)) {
    return "pending";
  }
  return "failed";
}

function payoutStatus(status) {
  if (status === "paid") return "succeeded";
  if (["pending", "in_transit", "created"].includes(status)) return "pending";
  return "failed";
}

export const stripeProvider = {
  name: "stripe",

  async createPaymentIntent({ amountMinor, currency, metadata, idempotencyKey }) {
    const intent = await call(() => stripe.paymentIntents.create({
      amount: amountMinor,
      currency,
      metadata,
      capture_method: "automatic",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    }, { idempotencyKey }));
    return {
      id: intent.id,
      clientSecret: intent.client_secret,
      status: paymentStatus(intent.status),
      providerStatus: intent.status,
      amountMinor: intent.amount,
      currency: intent.currency,
      metadata: intent.metadata,
    };
  },

  async getPaymentIntent(id) {
    const intent = await call(() => stripe.paymentIntents.retrieve(id, { expand: ["latest_charge"] }));
    return {
      id: intent.id || id,
      clientSecret: intent.client_secret,
      status: paymentStatus(intent.status),
      providerStatus: intent.status,
      amountMinor: intent.amount_received || intent.amount,
      currency: intent.currency,
      metadata: intent.metadata,
      latestChargeId: typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id,
    };
  },

  async createTransfer({ amountMinor, currency, destination, metadata, idempotencyKey, sourceTransaction }) {
    const transfer = await call(() => stripe.transfers.create(
      {
        amount: amountMinor,
        currency,
        destination,
        metadata,
        ...(sourceTransaction ? { source_transaction: sourceTransaction } : {}),
      },
      { idempotencyKey }
    ));
    return { id: transfer.id, status: "succeeded", providerStatus: "succeeded" };
  },

  async getTransfer(id) {
    const transfer = await call(() => stripe.transfers.retrieve(id));
    return { id: transfer.id, status: "succeeded", providerStatus: transfer.status || "succeeded" };
  },

  async createRefund({ paymentIntentId, idempotencyKey }) {
    const refund = await call(() => stripe.refunds.create(
      { payment_intent: paymentIntentId },
      { idempotencyKey }
    ));
    return { id: refund.id, status: refund.status === "succeeded" ? "succeeded" : "pending", providerStatus: refund.status };
  },

  async getRefund(id) {
    const refund = await call(() => stripe.refunds.retrieve(id));
    return { id: refund.id, status: refund.status === "succeeded" ? "succeeded" : "pending", providerStatus: refund.status };
  },

  async createConnectedAccount({ email }) {
    return call(() => stripe.accounts.create({ type: "express", email, capabilities: { transfers: { requested: true } } }));
  },

  async getConnectedAccount(id) {
    const account = await call(() => stripe.accounts.retrieve(id));
    return {
      id: account.id,
      chargesEnabled: Boolean(account.charges_enabled),
      payoutsEnabled: Boolean(account.payouts_enabled),
      detailsSubmitted: Boolean(account.details_submitted),
      requirementsDue: account.requirements?.currently_due || [],
      disabledReason: account.requirements?.disabled_reason || null,
    };
  },

  async createAccountLink({ account, refreshUrl, returnUrl }) {
    return call(() => stripe.accountLinks.create({
      account,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    }));
  },

  async createLoginLink(account) {
    return call(() => stripe.accounts.createLoginLink(account));
  },

  async getConnectedBalance(account) {
    const balance = await call(() => stripe.balance.retrieve({}, { stripeAccount: account }));
    return (balance.available || []).map((entry) => ({ currency: entry.currency, amountMinor: entry.amount }));
  },

  async createPayout({ amountMinor, currency, metadata, account, idempotencyKey }) {
    const payout = await call(() => stripe.payouts.create(
      { amount: amountMinor, currency, metadata },
      { stripeAccount: account, idempotencyKey }
    ));
    return {
      id: payout.id,
      status: payoutStatus(payout.status),
      providerStatus: payout.status,
      failureCode: payout.failure_code,
      failureMessage: payout.failure_message,
    };
  },

  verifyWebhook(payload, signature) {
    try {
      return stripe.webhooks.constructEvent(payload, signature, paymentConfig.stripeWebhookSecret);
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
