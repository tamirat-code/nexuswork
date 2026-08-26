import crypto from "node:crypto";
import FinancialAccount from "./financial-accounts.model.js";
import FinancialJournal from "./financial-journals.model.js";
import { money } from "../../shared/money/money.js";
import { ValidationError } from "../../shared/exceptions/AppError.js";

const ACCOUNT_DEFINITIONS = Object.freeze({
  provider_clearing: ["asset", "Provider clearing"],
  escrow_liability: ["liability", "Escrow liability"],
  student_payable: ["liability", "Student payable"],
  platform_revenue: ["revenue", "Platform revenue"],
  payout_clearing: ["liability", "Payout clearing"],
  payment_processing_fee: ["expense", "Payment processing fee"],
  refund_clearing: ["asset", "Refund clearing"],
  adjustments: ["equity", "Financial adjustments"],
});

function accountKey(base, currency, ownerId) {
  return ownerId ? `${base}:${currency}:${ownerId}` : `${base}:${currency}`;
}

async function ensureAccount(base, currency, ownerId) {
  const definition = ACCOUNT_DEFINITIONS[base];
  if (!definition) throw new ValidationError(`Unknown financial account: ${base}`);
  const key = accountKey(base, currency, ownerId);
  return FinancialAccount.findOneAndUpdate(
    { key },
    {
      $setOnInsert: {
        key,
        type: definition[0],
        currency,
        owner_id: ownerId,
        name: ownerId ? `${definition[1]} (${ownerId})` : definition[1],
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

function validateEntries(entries) {
  if (!Array.isArray(entries) || entries.length < 2) throw new ValidationError("A journal requires at least two entries");
  const currencies = new Set(entries.map((entry) => entry.currency));
  if (currencies.size !== 1) throw new ValidationError("A journal cannot mix currencies");

  let debits = 0;
  let credits = 0;
  for (const entry of entries) {
    money(entry.debitMinor, entry.currency);
    money(entry.creditMinor, entry.currency);
    if (entry.debitMinor > 0 && entry.creditMinor > 0) throw new ValidationError("A journal entry cannot be both debit and credit");
    if (entry.debitMinor === 0 && entry.creditMinor === 0) throw new ValidationError("A journal entry must have a non-zero side");
    debits += entry.debitMinor;
    credits += entry.creditMinor;
  }
  if (debits !== credits) throw new ValidationError("Journal debits must equal credits");
  return [...currencies][0];
}

export async function postJournal({
  eventType,
  idempotencyKey,
  sourceType,
  sourceId,
  requestId = "system",
  actorId,
  actorRole = "system",
  providerEventId,
  entries,
  metadata = {},
  reversedTransactionId,
} = {}) {
  if (!idempotencyKey) throw new ValidationError("Ledger idempotency key is required");
  if (!eventType || !sourceType || !sourceId) throw new ValidationError("Ledger source and event type are required");
  const currency = validateEntries(entries);

  const existing = await FinancialJournal.findOne({ idempotency_key: idempotencyKey });
  if (existing) return { journal: existing, duplicate: true };

  const resolvedEntries = [];
  for (const entry of entries) {
    const account = await ensureAccount(entry.accountBase, currency, entry.ownerId);
    resolvedEntries.push({
      account_key: account.key,
      account_type: account.type,
      owner_id: entry.ownerId,
      debit_minor: entry.debitMinor,
      credit_minor: entry.creditMinor,
      currency,
    });
  }

  try {
    const journal = await FinancialJournal.create({
      transaction_id: crypto.randomUUID(),
      idempotency_key: idempotencyKey,
      event_type: eventType,
      source_type: sourceType,
      source_id: String(sourceId),
      provider_event_id: providerEventId,
      request_id: requestId,
      actor_id: actorId,
      actor_role: actorRole,
      entries: resolvedEntries,
      reversed_transaction_id: reversedTransactionId,
      metadata,
    });
    return { journal, duplicate: false };
  } catch (error) {
    if (error.code === 11000) {
      const journal = await FinancialJournal.findOne({ idempotency_key: idempotencyKey });
      if (journal) return { journal, duplicate: true };
    }
    throw error;
  }
}

export async function reverseJournal(transactionId, { requestId = "system", actorId, actorRole = "system", idempotencyKey } = {}) {
  const original = await FinancialJournal.findOne({ transaction_id: transactionId });
  if (!original) throw new ValidationError("Original financial journal was not found");
  const reversalKey = idempotencyKey || `reversal:${transactionId}`;
  return postJournal({
    eventType: "journal.reversed",
    idempotencyKey: reversalKey,
    sourceType: "financial_journal",
    sourceId: transactionId,
    requestId,
    actorId,
    actorRole,
    reversedTransactionId: transactionId,
    metadata: { originalEventType: original.event_type },
    entries: original.entries.map((entry) => ({
      accountBase: entry.account_key.split(":")[0],
      ownerId: entry.owner_id,
      debitMinor: entry.credit_minor,
      creditMinor: entry.debit_minor,
      currency: entry.currency,
    })),
  });
}

export async function getStudentPayableBalance(userId, currency) {
  return getAccountBalance(accountKey("student_payable", currency, userId));
}

export async function getAccountBalance(key) {
  const result = await FinancialJournal.aggregate([
    { $unwind: "$entries" },
    { $match: { "entries.account_key": key } },
    { $group: { _id: null, credits: { $sum: "$entries.credit_minor" }, debits: { $sum: "$entries.debit_minor" }, entries: { $sum: 1 } } },
  ]);
  return {
    hasEntries: Number(result[0]?.entries || 0) > 0,
    balanceMinor: Math.max(0, Number(result[0]?.credits || 0) - Number(result[0]?.debits || 0)),
  };
}

export const ledgerAccountDefinitions = ACCOUNT_DEFINITIONS;
