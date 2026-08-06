import { stripe } from "../payments/stripe.client.js";
import Wallet from "./wallets.model.js";
import User from "../users/users.model.js";
import { paymentConfig } from "../../config/payment.config.js";
import { NotFoundError } from "../../shared/exceptions/AppError.js";

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