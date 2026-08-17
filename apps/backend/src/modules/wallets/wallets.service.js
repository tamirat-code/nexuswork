import { stripe } from "../payments/stripe.client.js";
import Wallet from "./wallets.model.js";
import Withdrawal from "./withdrawal.model.js";
import User from "../users/users.model.js";
import Contract from "../contracts/contracts.model.js";
import Milestone from "../milestones/milestones.model.js";
import Payment from "../payments/payments.model.js";
import { paymentConfig } from "../../config/payment.config.js";
import { NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

export async function getWallet(userId) {
  return Wallet.findOne({ user_id: userId });
}

export async function getBalance(userId) {
  const wallet = await Wallet.findOne({ user_id: userId });
  if (!wallet) throw new NotFoundError("Wallet not found");
  if (!wallet.stripe_account_id || !wallet.stripe_onboarding_complete) {
    return { available: 0, pending: 0, currency: paymentConfig.currency, onboarding_complete: false };
  }
  const balance = await stripe.balance.retrieve({ stripeAccount: wallet.stripe_account_id });
  const available = balance.available.find((b) => b.currency === paymentConfig.currency)?.amount || 0;
  const pending = balance.pending.find((b) => b.currency === paymentConfig.currency)?.amount || 0;
  return {
    available: available / 100,
    pending: pending / 100,
    currency: paymentConfig.currency,
    onboarding_complete: true,
  };
}

export async function startOnboarding(userId) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  let wallet = await Wallet.findOne({ user_id: userId });
  if (!wallet) wallet = await Wallet.create({ user_id: userId });

  if (!wallet.stripe_account_id) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: { transfers: { requested: true } },
    });
    wallet.stripe_account_id = account.id;
    await wallet.save();
  }

  const accountLink = await stripe.accountLinks.create({
    account: wallet.stripe_account_id,
    refresh_url: paymentConfig.connectRefreshUrl,
    return_url: paymentConfig.connectReturnUrl,
    type: "account_onboarding",
  });

  return { onboarding_url: accountLink.url };
}

export async function markOnboardingStatus(stripeAccountId, isComplete) {
  return Wallet.findOneAndUpdate(
    { stripe_account_id: stripeAccountId },
    { stripe_onboarding_complete: isComplete },
    { new: true }
  );
}


export async function listTransactions(userId, { limit = 50 } = {}) {
  const contractIds = await Contract.find({ student_id: userId }).distinct("_id");
  const milestoneIds = contractIds.length
    ? await Milestone.find({ contract_id: { $in: contractIds } }).distinct("_id")
    : [];

  const [releases, withdrawals] = await Promise.all([
    milestoneIds.length
      ? Payment.find({ milestone_id: { $in: milestoneIds }, direction: "release", status: "succeeded" })
          .populate("milestone_id", "title")
          .sort({ createdAt: -1 })
          .limit(Number(limit))
          .lean()
      : [],
    Withdrawal.find({ user_id: userId }).sort({ createdAt: -1 }).limit(Number(limit)).lean(),
  ]);

  const releaseTx = releases.map((p) => ({
    _id: p._id,
    type: "deposit",
    description: `Milestone released: ${p.milestone_id?.title || "Milestone"}`,
    amount: p.amount,
    createdAt: p.createdAt,
  }));

  const withdrawalTx = withdrawals.map((w) => ({
    _id: w._id,
    type: "withdrawal",
    description: w.status === "failed" ? `Withdrawal failed: ${w.failure_reason || "unknown error"}` : "Withdrawal to bank account",
    amount: w.amount,
    createdAt: w.createdAt,
  }));

  return [...releaseTx, ...withdrawalTx]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, Number(limit));
}


export async function requestWithdrawal(userId, amount) {
  if (!(amount > 0)) throw new ValidationError("Withdrawal amount must be greater than zero");

  const wallet = await Wallet.findOne({ user_id: userId });
  if (!wallet || !wallet.stripe_account_id || !wallet.stripe_onboarding_complete) {
    throw new ValidationError("Complete payout account setup before requesting a withdrawal");
  }

  const withdrawal = await Withdrawal.create({
    user_id: userId,
    amount,
    currency: paymentConfig.currency,
    status: "pending",
  });

  try {
    const payout = await stripe.payouts.create(
      { amount: Math.round(amount * 100), currency: paymentConfig.currency },
      { stripeAccount: wallet.stripe_account_id }
    );
    withdrawal.status = "paid";
    withdrawal.stripe_payout_id = payout.id;
    await withdrawal.save();
  } catch (err) {
    withdrawal.status = "failed";
    withdrawal.failure_reason = err.message;
    await withdrawal.save();
    throw new ValidationError(`Withdrawal failed: ${err.message}`);
  }

  return withdrawal;
}