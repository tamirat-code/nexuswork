import Payment from "./payments.model.js";
import { paymentConfig } from "../../config/payment.config.js";

// Simulates the payment gateway's test/sandbox mode (Section 3.9 / 5.6).
// Swap the body of this function for a real Stripe/Chapa/SantimPay call —
// callers don't need to change since they only see { status, processor_ref }.
export async function processSandboxPayment(amount) {
  return { status: "succeeded", processor_ref: `${paymentConfig.provider}_sandbox_${Date.now()}` };
}

export async function recordPayment({ milestone_id, amount, direction }) {
  const result = await processSandboxPayment(amount);
  return Payment.create({ milestone_id, amount, direction, ...result });
}

export async function listForUser(userId) {
  // Payment history joined through milestones/contracts is left as a follow-up query;
  // this returns raw payment records for now.
  return Payment.find().sort({ createdAt: -1 }).limit(100);
}
