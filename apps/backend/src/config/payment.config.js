import { env } from "./env.js";

export const paymentConfig = {
  provider: env.paymentProvider,
  stripeSecretKey: env.stripeSecretKey,
  stripeWebhookSecret: env.stripeWebhookSecret,
  commissionRate: env.commissionRate,
  commissionRateBps: env.commissionRateBps,
  currency: env.paymentCurrency,
  connectRefreshUrl: env.stripeConnectRefreshUrl,
  connectReturnUrl: env.stripeConnectReturnUrl,
};
