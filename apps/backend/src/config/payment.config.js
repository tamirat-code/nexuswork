import { env } from "./env.js";

export const paymentConfig = {
  provider: env.paymentProvider,
  stripeSecretKey: env.stripeSecretKey,
  stripeWebhookSecret: env.stripeWebhookSecret,
  commissionRate: env.commissionRate,
  currency: env.paymentCurrency,
  connectRefreshUrl: env.stripeConnectRefreshUrl,
  connectReturnUrl: env.stripeConnectReturnUrl,
};
