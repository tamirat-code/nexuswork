// Payment gateway config (Section 3.9). Stripe test mode for development;
// swap PAYMENT_PROVIDER + keys for a regional processor (Chapa, SantimPay, Telebirr) in production.
export const paymentConfig = {
  provider: process.env.PAYMENT_PROVIDER || "stripe",
  secretKey: process.env.PAYMENT_SECRET_KEY,
  commissionRate: Number(process.env.COMMISSION_RATE || 0.1),
};
