import crypto from "node:crypto";
import { getPaymentProvider } from "../payments/providers/index.js";
import { logger } from "../../shared/logger/logger.js";
import Wallet from "./wallets.model.js";
import Withdrawal from "./withdrawal.model.js";
import User from "../users/users.model.js";
import Contract from "../contracts/contracts.model.js";
import Milestone from "../milestones/milestones.model.js";
import Payment from "../payments/payments.model.js";
import { paymentConfig } from "../../config/payment.config.js";
import { env } from "../../config/env.js";
import { NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";
import { logAction } from "../audit-logs/audit-logs.service.js";
import { moneyFromLegacyMajorUnits } from "../../shared/money/money.js";
import { getStudentPayableBalance, postJournal, reverseJournal } from "../financial-ledger/financial-ledger.service.js";

const PAYOUT_KEY = crypto.createHash("sha256").update(String(env.jwtSecret || "nexuswork-development-key")).digest();

function encryptAccountNumber(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", PAYOUT_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptAccountNumber(value) {
  const [ivText, tagText, encryptedText] = String(value || "").split(".");
  if (!ivText || !tagText || !encryptedText) throw new ValidationError("Stored payout account details are invalid");
  const decipher = crypto.createDecipheriv("aes-256-gcm", PAYOUT_KEY, Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedText, "base64url")), decipher.final()]).toString("utf8");
}

function chapaPayoutStatus(wallet) {
  return {
    chapa_payout_ready: Boolean(
      wallet?.chapa_bank_code && wallet?.chapa_account_name && wallet?.chapa_account_number_encrypted
    ),
    chapa_bank_code: wallet?.chapa_bank_code || null,
    chapa_account_name: wallet?.chapa_account_name || null,
    chapa_account_number_last4: wallet?.chapa_account_number_last4 || null,
  };
}

export async function saveChapaPayoutDetails(userId, { bank_code, account_name, account_number }, auditContext = {}) {
  const wallet = await Wallet.findOneAndUpdate(
    { user_id: userId },
    {
      $set: {
        chapa_bank_code: String(bank_code).trim(),
        chapa_account_name: String(account_name).trim(),
        chapa_account_number_encrypted: encryptAccountNumber(String(account_number).trim()),
        chapa_account_number_last4: String(account_number).trim().slice(-4),
      },
      $setOnInsert: { user_id: userId },
    },
    { upsert: true, new: true }
  );
  await logAction({
    actor_id: userId,
    actor_role: auditContext.actor?.role || "student",
    action_type: "settings_changed",
    eventType: "settings_changed",
    action: "wallet.chapa_payout_details_updated",
    entity_type: "user",
    entity_id: userId,
    metadata: { bank_code: wallet.chapa_bank_code, account_last4: wallet.chapa_account_number_last4 },
    correlationId: auditContext.correlationId || crypto.randomUUID(),
  });
  return {
    chapa_payout_ready: true,
    chapa_bank_code: wallet.chapa_bank_code,
    chapa_account_name: wallet.chapa_account_name,
    chapa_account_number_last4: wallet.chapa_account_number_last4,
  };
}

export function getChapaPayoutDestination(wallet) {
  if (!wallet?.chapa_bank_code || !wallet?.chapa_account_name || !wallet?.chapa_account_number_encrypted) return null;
  return {
    bankCode: wallet.chapa_bank_code,
    accountName: wallet.chapa_account_name,
    accountNumber: decryptAccountNumber(wallet.chapa_account_number_encrypted),
  };
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

  const stripeProvider = getPaymentProvider("stripe");
  const account = await stripeProvider.getConnectedAccount(wallet.stripe_account_id);
  const complete = Boolean(account.chargesEnabled && account.payoutsEnabled);

  if (wallet.stripe_onboarding_complete !== complete) {
    wallet.stripe_onboarding_complete = complete;
    await wallet.save();
  }

  return {
    onboarding_complete: complete,
    payouts_enabled: account.payoutsEnabled,
    charges_enabled: account.chargesEnabled,
    details_submitted: account.detailsSubmitted,
    requirements_due: account.requirementsDue,
    disabled_reason: account.disabledReason,
  };
}

export async function getWallet(userId) {
  return Wallet.findOne({ user_id: userId });
}

export async function getBalance(userId) {
  const wallet = await Wallet.findOne({ user_id: userId });
  if (!wallet) throw new NotFoundError("Wallet not found");
  const walletCurrency = String(wallet.currency || paymentConfig.currency).toLowerCase();

  const payoutStatus = await syncStripeAccountStatus(wallet);

  const ledgerBalance = await getStudentPayableBalance(userId, walletCurrency);
  const etbLedgerBalance = walletCurrency === "etb"
    ? ledgerBalance
    : await getStudentPayableBalance(userId, "etb");
  const usdLedgerBalance = walletCurrency === "usd"
    ? ledgerBalance
    : await getStudentPayableBalance(userId, "usd");
  const balances = {
    usd: { available: usdLedgerBalance.hasEntries ? usdLedgerBalance.balanceMinor / 100 : 0, currency: "usd" },
    etb: { available: etbLedgerBalance.hasEntries ? etbLedgerBalance.balanceMinor / 100 : 0, currency: "etb" },
  };
  if (ledgerBalance.hasEntries) {
    const pending = await Withdrawal.aggregate([
      { $match: { user_id: userId, status: "pending", currency: walletCurrency } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    return {
      available: ledgerBalance.balanceMinor / 100,
      pending: Number(pending[0]?.total || 0),
      currency: walletCurrency,
      balances,
      ...payoutStatus,
      ...chapaPayoutStatus(wallet),
    };
  }

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
              currency: walletCurrency,
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
          currency: walletCurrency,
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
    currency: walletCurrency,
    balances,
    ...payoutStatus,
    ...chapaPayoutStatus(wallet),
  };
}

export async function getPayoutStatus(userId) {
  const wallet = await Wallet.findOne({ user_id: userId });
  if (!wallet) throw new NotFoundError("Wallet not found");
  return {
    ...(await syncStripeAccountStatus(wallet)),
    ...chapaPayoutStatus(wallet),
  };
}

export async function getChapaBanks() {
  const chapa = getPaymentProvider("chapa");
  if (typeof chapa.listBanks !== "function") {
    throw new NotFoundError("Chapa payout destinations are unavailable");
  }
  return chapa.listBanks();
}

export async function startOnboarding(userId) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  let wallet = await Wallet.findOne({ user_id: userId });
  if (!wallet) wallet = await Wallet.create({ user_id: userId });

  if (!wallet.stripe_account_id) {
    const stripeProvider = getPaymentProvider("stripe");
    const account = await stripeProvider.createConnectedAccount({ email: user.email });

    wallet.stripe_account_id = account.id;
    await wallet.save();
  }

  const status = await syncStripeAccountStatus(wallet);

  if (status.onboarding_complete) {
    const stripeProvider = getPaymentProvider("stripe");
    const loginLink = await stripeProvider.createLoginLink(wallet.stripe_account_id);
    return {
      onboarding_url: loginLink.url,
      already_complete: true,
      ...status,
    };
  }

  const stripeProvider = getPaymentProvider("stripe");
  const accountLink = await stripeProvider.createAccountLink({
    account: wallet.stripe_account_id,
    refreshUrl: paymentConfig.connectRefreshUrl,
    returnUrl: paymentConfig.connectReturnUrl,
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
        : w.status === "pending"
          ? "Withdrawal pending — processing by Stripe"
        : "Withdrawal to bank account",
    amount: w.amount,
    status: w.status,
    stripe_payout_id: w.stripe_payout_id,
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

  const walletCurrency = String(wallet.currency || paymentConfig.currency).toLowerCase();
  const withdrawalMoney = moneyFromLegacyMajorUnits(amount, walletCurrency, "withdrawal.amount");
  let withdrawal;
  let ledgerJournal;

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
                  currency: walletCurrency,
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
            currency: walletCurrency,
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
        )} ${walletCurrency.toUpperCase()}`
      );
    }

    // The wallet row is atomically locked above. Creating the pending
    // withdrawal while that lock is held makes the reservation visible
    // before another withdrawal request can acquire the lock.
    withdrawal = await Withdrawal.create({
      user_id: userId,
      amount,
      amount_minor: withdrawalMoney.amountMinor,
      currency: walletCurrency,
      status: "pending",
      idempotency_key: operationKey,
      processing_at: new Date(),
    });

    try {
      const payableBalance = await getStudentPayableBalance(userId, walletCurrency);
      if (payableBalance.hasEntries && payableBalance.balanceMinor < withdrawalMoney.amountMinor) {
        throw new ValidationError("Insufficient ledger payable balance");
      }
      const posted = await postJournal({
        eventType: "withdrawal.reserved",
        idempotencyKey: `withdrawal-reserved:${withdrawal._id}`,
        sourceType: "withdrawal",
        sourceId: withdrawal._id,
        requestId: correlationId || "system",
        actorId: actor?._id || actor?.id,
        actorRole: actor?.role || "system",
        entries: [
          { accountBase: "student_payable", ownerId: userId, debitMinor: withdrawalMoney.amountMinor, creditMinor: 0, currency: walletCurrency },
          { accountBase: "payout_clearing", debitMinor: 0, creditMinor: withdrawalMoney.amountMinor, currency: walletCurrency },
        ],
      metadata: { withdrawalId: withdrawal._id, operationKey, currency: walletCurrency },
      });
      ledgerJournal = posted.journal;
      withdrawal.ledger_transaction_id = ledgerJournal.transaction_id;
      await withdrawal.save();
    } catch (error) {
      withdrawal.status = "failed";
      withdrawal.failure_reason = error.message;
      await withdrawal.save();
      throw error;
    }

    await logAction({
      actor_id: actor?.id || actor?._id,
      actor_role: actor?.role || "system",
      action_type: "WITHDRAWAL_REQUESTED",
      eventType: "WITHDRAWAL_REQUESTED",
      action: "withdrawal.requested",
      entity_type: "payment",
      entity_id: withdrawal._id,
      metadata: { amount, currency: walletCurrency, operationKey },
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

    // Released milestone funds are already in the student's connected
    // account. Withdrawals must use that account's balance and payout rail.
    const stripeProvider = getPaymentProvider("stripe");
    const connectedBalance = await stripeProvider.getConnectedBalance(currentWallet.stripe_account_id);
    const connectedAvailableMinor = Number(
      connectedBalance.find((b) => b.currency === walletCurrency)?.amountMinor || 0
    );

    if (connectedAvailableMinor < withdrawalMoney.amountMinor) {
      throw new Error(
        "The connected Stripe account does not have enough available funds to complete this withdrawal"
      );
    }

    const payout = await stripeProvider.createPayout({
      amountMinor: withdrawalMoney.amountMinor,
      currency: walletCurrency,
      metadata: {
        withdrawal_id: String(withdrawal._id),
        user_id: String(userId),
      },
      account: currentWallet.stripe_account_id,
      idempotencyKey: `nexuswork-withdrawal-${withdrawal._id}`,
    });

    withdrawal.status = payout.status === "succeeded" ? "paid" : payout.status === "failed" ? "failed" : "pending";
    withdrawal.stripe_payout_id = payout.id;
    withdrawal.failure_reason = undefined;
    withdrawal.processing_at = undefined;
    if (withdrawal.status === "failed") {
      withdrawal.failure_reason = payout.failureMessage || payout.failureCode || "Payout provider failed";
    }

    await withdrawal.save();

    await logAction({
      actor_id: actor?.id || actor?._id,
      actor_role: actor?.role || "system",
      action_type: withdrawal.status === "paid" ? "WITHDRAWAL_SUCCEEDED" : withdrawal.status === "failed" ? "WITHDRAWAL_FAILED" : "WITHDRAWAL_REQUESTED",
      eventType: withdrawal.status === "paid" ? "WITHDRAWAL_SUCCEEDED" : withdrawal.status === "failed" ? "WITHDRAWAL_FAILED" : "WITHDRAWAL_REQUESTED",
      action: withdrawal.status === "paid" ? "withdrawal.succeeded" : withdrawal.status === "failed" ? "withdrawal.failed" : "withdrawal.pending",
      entity_type: "payment",
      entity_id: withdrawal._id,
      metadata: { amount, currency: walletCurrency, payoutId: payout.id, payoutStatus: withdrawal.status },
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

    if (ledgerJournal?.transaction_id) {
      try {
        const reversal = await reverseJournal(ledgerJournal.transaction_id, {
          requestId: correlationId || "system",
          actorId: actor?._id || actor?.id,
          actorRole: actor?.role || "system",
          idempotencyKey: `withdrawal-reversed:${withdrawal._id}`,
        });
        withdrawal.ledger_reversal_transaction_id = reversal.journal.transaction_id;
        await withdrawal.save();
      } catch (reversalError) {
        logger.error(`[wallet] failed to reverse withdrawal ledger ${withdrawal._id}:`, reversalError.message);
      }
    }

    await logAction({
      actor_id: actor?.id || actor?._id,
      actor_role: actor?.role || "system",
      action_type: "WITHDRAWAL_FAILED",
      eventType: "WITHDRAWAL_FAILED",
      action: "withdrawal.failed",
      entity_type: "payment",
      entity_id: withdrawal._id,
      metadata: { amount, currency: walletCurrency, error: reason },
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

const PAYOUT_STATUS_MAP = {
  "payout.created": "pending",
  "payout.updated": null,
  "payout.paid": "paid",
  "payout.failed": "failed",
  "payout.canceled": "failed",
};

export async function updateWithdrawalFromPayoutEvent(eventType, payout, { connectedAccountId, correlationId } = {}) {
  const withdrawalId = payout?.metadata?.withdrawal_id;
  let withdrawal = withdrawalId
    ? await Withdrawal.findById(withdrawalId)
    : await Withdrawal.findOne({ stripe_payout_id: payout?.id });
  if (!withdrawal) return null;

  if (connectedAccountId) {
    const wallet = await Wallet.findOne({ user_id: withdrawal.user_id, stripe_account_id: connectedAccountId });
    if (!wallet) throw new ValidationError("Stripe payout account does not match the withdrawal owner");
  }

  const nextStatus = PAYOUT_STATUS_MAP[eventType];
  if (!nextStatus) return withdrawal;
  if (withdrawal.status === "paid" && nextStatus !== "paid") return withdrawal;
  if (withdrawal.status === "failed" && nextStatus === "pending") return withdrawal;

  const previousStatus = withdrawal.status;
  withdrawal.status = nextStatus;
  withdrawal.stripe_payout_id = payout.id || withdrawal.stripe_payout_id;
  withdrawal.processing_at = undefined;
  if (nextStatus === "failed") {
    withdrawal.failure_reason = payout.failure_message || payout.failure_code || "Stripe payout failed";
  } else {
    withdrawal.failure_reason = undefined;
  }
  await withdrawal.save();

  if (nextStatus === "failed" && previousStatus !== "failed" && withdrawal.ledger_transaction_id) {
    const reversal = await reverseJournal(withdrawal.ledger_transaction_id, {
      requestId: correlationId || "system",
      actorRole: "system",
      idempotencyKey: `withdrawal-reversed:${withdrawal._id}`,
    });
    withdrawal.ledger_reversal_transaction_id = reversal.journal.transaction_id;
    await withdrawal.save();
  }

  if (previousStatus !== nextStatus) {
    const action = nextStatus === "paid" ? "succeeded" : nextStatus === "failed" ? "failed" : "pending";
    await logAction({
      actor_role: "system",
      action_type: nextStatus === "paid" ? "WITHDRAWAL_SUCCEEDED" : nextStatus === "failed" ? "WITHDRAWAL_FAILED" : "WITHDRAWAL_REQUESTED",
      eventType: nextStatus === "paid" ? "WITHDRAWAL_SUCCEEDED" : nextStatus === "failed" ? "WITHDRAWAL_FAILED" : "WITHDRAWAL_REQUESTED",
      action: `withdrawal.${action}`,
      entity_type: "payment",
      entity_id: withdrawal._id,
      metadata: { payoutId: withdrawal.stripe_payout_id, previousStatus, status: nextStatus },
      correlationId: correlationId || crypto.randomUUID(),
    });
  }
  return withdrawal;
}
