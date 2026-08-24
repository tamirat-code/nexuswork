import crypto from "node:crypto";
import { stripe } from "../payments/stripe.client.js";
import { logger } from "../../shared/logger/logger.js";
import Wallet from "./wallets.model.js";
import Withdrawal from "./withdrawal.model.js";
import User from "../users/users.model.js";
import Contract from "../contracts/contracts.model.js";
import Milestone from "../milestones/milestones.model.js";
import Payment from "../payments/payments.model.js";
import { paymentConfig } from "../../config/payment.config.js";
import { NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";
import { logAction } from "../audit-logs/audit-logs.service.js";

async function getPlatformAvailableBalance() {
  const balance = await stripe.balance.retrieve();
  const available = balance.available.find(
    (b) => b.currency === paymentConfig.currency
  );
  return Number(available?.amount || 0) / 100;
}

async function syncStripeAccountStatus(wallet) {
  if (!wallet?.stripe_account_id) {
    return {
      onboarding_complete: false,
      payouts_enabled: false,
      charges_enabled: false,
      details_submitted: false,
      requirements_due: [],
      disabled_reason: null,
    };
  }

  const account = await stripe.accounts.retrieve(wallet.stripe_account_id);
  const complete = Boolean(account.charges_enabled && account.payouts_enabled);

  if (wallet.stripe_onboarding_complete !== complete) {
    wallet.stripe_onboarding_complete = complete;
    await wallet.save();
  }

  return {
    onboarding_complete: complete,
    payouts_enabled: Boolean(account.payouts_enabled),
    charges_enabled: Boolean(account.charges_enabled),
    details_submitted: Boolean(account.details_submitted),
    requirements_due: account.requirements?.currently_due || [],
    disabled_reason: account.requirements?.disabled_reason || null,
  };
}

export async function getWallet(userId) {
  return Wallet.findOne({ user_id: userId });
}

export async function getBalance(userId) {
  const wallet = await Wallet.findOne({ user_id: userId });
  if (!wallet) throw new NotFoundError("Wallet not found");

  const payoutStatus = await syncStripeAccountStatus(wallet);

  // NexusWork wallet balance is the internal earnings ledger. Stripe Connect
  // is only the payout rail; its balance must not be used as the wallet
  // balance because Stripe may automatically pay it out to the bank.
  const contractIds = await Contract.find({ student_id: userId }).distinct("_id");
  const milestoneIds = contractIds.length
    ? await Milestone.find({ contract_id: { $in: contractIds } }).distinct("_id")
    : [];

  const [releaseTotals, withdrawalTotals] = await Promise.all([
    milestoneIds.length
      ? Payment.aggregate([
          {
            $match: {
              milestone_id: { $in: milestoneIds },
              direction: "release",
              status: "succeeded",
              currency: paymentConfig.currency,
              $or: [
                { stripe_transfer_id: { $exists: false } },
                { stripe_transfer_id: null },
              ],
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ])
      : [],
    Withdrawal.aggregate([
      {
        $match: {
          user_id: userId,
          status: { $in: ["pending", "paid"] },
          currency: paymentConfig.currency,
        },
      },
      { $group: { _id: "$status", total: { $sum: "$amount" } } },
    ]),
  ]);

  const released = Number(releaseTotals[0]?.total || 0);
  const paidWithdrawals = Number(
    withdrawalTotals.find((item) => item._id === "paid")?.total || 0
  );
  const pendingWithdrawals = Number(
    withdrawalTotals.find((item) => item._id === "pending")?.total || 0
  );

  return {
    available: Math.max(0, released - paidWithdrawals - pendingWithdrawals),
    pending: pendingWithdrawals,
    currency: paymentConfig.currency,
    ...payoutStatus,
  };
}

export async function getPayoutStatus(userId) {
  const wallet = await Wallet.findOne({ user_id: userId });
  if (!wallet) throw new NotFoundError("Wallet not found");
  return syncStripeAccountStatus(wallet);
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

  const status = await syncStripeAccountStatus(wallet);

  if (status.onboarding_complete) {
    const loginLink = await stripe.accounts.createLoginLink(wallet.stripe_account_id);
    return {
      onboarding_url: loginLink.url,
      already_complete: true,
      ...status,
    };
  }

  const accountLink = await stripe.accountLinks.create({
    account: wallet.stripe_account_id,
    refresh_url: paymentConfig.connectRefreshUrl,
    return_url: paymentConfig.connectReturnUrl,
    type: "account_onboarding",
  });

  return {
    onboarding_url: accountLink.url,
    already_complete: false,
    ...status,
  };
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
      ? Payment.find({
          milestone_id: { $in: milestoneIds },
          direction: "release",
          status: "succeeded",
        })
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
    description:
      w.status === "failed"
        ? `Withdrawal failed: ${w.failure_reason || "unknown error"}`
        : "Withdrawal to bank account",
    amount: w.amount,
    createdAt: w.createdAt,
  }));

  return [...releaseTx, ...withdrawalTx]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, Number(limit));
}

export async function requestWithdrawal(userId, amount, { actor, correlationId, idempotencyKey } = {}) {
  if (!(amount > 0) || !Number.isFinite(amount)) {
    throw new ValidationError("Withdrawal amount must be greater than zero");
  }

  const operationKey = String(idempotencyKey || crypto.randomUUID()).trim();
  if (operationKey.length < 8 || operationKey.length > 255) {
    throw new ValidationError("Idempotency-Key must be between 8 and 255 characters");
  }
  const existingWithdrawal = await Withdrawal.findOne({ idempotency_key: operationKey, user_id: userId });
  if (existingWithdrawal) return existingWithdrawal;

  const lockUntil = new Date(Date.now() + 30_000);
  const wallet = await Wallet.findOneAndUpdate(
    {
      user_id: userId,
      stripe_account_id: { $ne: null },
      $or: [
        { withdrawal_lock_until: null },
        { withdrawal_lock_until: { $lt: new Date() } },
      ],
    },
    {
      $set: { withdrawal_lock_until: lockUntil },
      $inc: { withdrawal_lock_version: 1 },
    },
    { new: true }
  );

  if (!wallet) {
    const existingWallet = await Wallet.findOne({ user_id: userId });

    if (!existingWallet || !existingWallet.stripe_account_id) {
      throw new ValidationError(
        "Complete payout account setup before requesting a withdrawal"
      );
    }

    throw new ValidationError(
      "Another withdrawal is being processed. Please try again in a few seconds."
    );
  }

  let withdrawal;

  try {
    const status = await syncStripeAccountStatus(wallet);

    if (!status.payouts_enabled) {
      throw new ValidationError(
        "Complete Stripe payout verification before requesting a withdrawal"
      );
    }

    const contractIds = await Contract.find({
      student_id: userId,
    }).distinct("_id");

    const milestoneIds = contractIds.length
      ? await Milestone.find({
          contract_id: { $in: contractIds },
        }).distinct("_id")
      : [];

    const [releaseTotals, withdrawalTotals] = await Promise.all([
      milestoneIds.length
        ? Payment.aggregate([
            {
              $match: {
                milestone_id: { $in: milestoneIds },
                direction: "release",
                status: "succeeded",
                currency: paymentConfig.currency,
                $or: [
                  { stripe_transfer_id: { $exists: false } },
                  { stripe_transfer_id: null },
                ],
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
              },
            },
          ])
        : [],

      Withdrawal.aggregate([
        {
          $match: {
            user_id: userId,
            status: { $in: ["pending", "paid"] },
            currency: paymentConfig.currency,
          },
        },
        {
          $group: {
            _id: "$status",
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const released = Number(releaseTotals[0]?.total || 0);

    const paidWithdrawals = Number(
      withdrawalTotals.find((item) => item._id === "paid")?.total || 0
    );

    const pendingWithdrawals = Number(
      withdrawalTotals.find((item) => item._id === "pending")?.total || 0
    );

    const available = Math.max(
      0,
      released - paidWithdrawals - pendingWithdrawals
    );

    if (amount > available + 1e-9) {
      throw new ValidationError(
        `Insufficient wallet balance. Available balance: ${available.toFixed(
          2
        )} ${paymentConfig.currency.toUpperCase()}`
      );
    }

    // The wallet row is atomically locked above. Creating the pending
    // withdrawal while that lock is held makes the reservation visible
    // before another withdrawal request can acquire the lock.
    withdrawal = await Withdrawal.create({
      user_id: userId,
      amount,
      currency: paymentConfig.currency,
      status: "pending",
      idempotency_key: operationKey,
      processing_at: new Date(),
    });

    await logAction({
      actor_id: actor?.id || actor?._id,
      actor_role: actor?.role || "system",
      action_type: "WITHDRAWAL_REQUESTED",
      eventType: "WITHDRAWAL_REQUESTED",
      action: "withdrawal.requested",
      entity_type: "payment",
      entity_id: withdrawal._id,
      metadata: { amount, currency: paymentConfig.currency, operationKey },
      correlationId: correlationId || crypto.randomUUID(),
    });
  } finally {
    await Wallet.updateOne(
      { _id: wallet._id },
      { $set: { withdrawal_lock_until: null } }
    );
  }

  try {
    // Wallet documents are keyed by user_id, not by the user's _id.
    const currentWallet = await Wallet.findOne({ user_id: userId });

    if (!currentWallet?.stripe_account_id) {
      throw new Error(
        "The student's payout account is no longer available"
      );
    }

    const platformAvailable = await getPlatformAvailableBalance();

    if (platformAvailable < amount) {
      throw new Error(
        "The platform does not have enough available funds to complete this withdrawal"
      );
    }

    const transfer = await stripe.transfers.create(
      {
        amount: Math.round(amount * 100),
        currency: paymentConfig.currency,
        destination: currentWallet.stripe_account_id,
        metadata: {
          withdrawal_id: String(withdrawal._id),
          user_id: String(userId),
        },
      },
      {
        idempotencyKey: `nexuswork-withdrawal-${withdrawal._id}`,
      }
    );

    withdrawal.status = "paid";
    withdrawal.stripe_payout_id = transfer.id;
    withdrawal.failure_reason = undefined;
    withdrawal.processing_at = undefined;

    await withdrawal.save();

    await logAction({
      actor_id: actor?.id || actor?._id,
      actor_role: actor?.role || "system",
      action_type: "WITHDRAWAL_SUCCEEDED",
      eventType: "WITHDRAWAL_SUCCEEDED",
      action: "withdrawal.succeeded",
      entity_type: "payment",
      entity_id: withdrawal._id,
      metadata: { amount, currency: paymentConfig.currency, transferId: transfer.id },
      correlationId: correlationId || crypto.randomUUID(),
    });
  } catch (err) {
    const reason =
      err?.message ||
      err?.raw?.message ||
      "Payout provider could not complete the transfer";

    withdrawal.status = "failed";
    withdrawal.failure_reason = reason;
    withdrawal.processing_at = undefined;

    await withdrawal.save();

    await logAction({
      actor_id: actor?.id || actor?._id,
      actor_role: actor?.role || "system",
      action_type: "WITHDRAWAL_FAILED",
      eventType: "WITHDRAWAL_FAILED",
      action: "withdrawal.failed",
      entity_type: "payment",
      entity_id: withdrawal._id,
      metadata: { amount, currency: paymentConfig.currency, error: reason },
      correlationId: correlationId || crypto.randomUUID(),
    });

    logger.error(
      `[wallet] withdrawal ${withdrawal._id} failed:`,
      err.message,
      err.stack
    );

    throw new ValidationError(`Withdrawal failed: ${reason}`);
  }

  return withdrawal;
}
