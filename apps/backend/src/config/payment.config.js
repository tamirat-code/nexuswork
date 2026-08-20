export const paymentConfig = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  commissionRate: Number(process.env.COMMISSION_RATE || 0.1),
  currency: process.env.PAYMENT_CURRENCY || "usd",
  connectRefreshUrl:
    process.env.STRIPE_CONNECT_REFRESH_URL ||
    "http://localhost:5173/wallet?connect=refresh",
  connectReturnUrl:
    process.env.STRIPE_CONNECT_RETURN_URL ||
    "http://localhost:5173/wallet?connect=done",
};