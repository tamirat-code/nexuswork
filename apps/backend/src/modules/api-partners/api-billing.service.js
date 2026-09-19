import crypto from "node:crypto";
import ApiBillingLedger from "./api-billing-ledger.model.js";
import { monthWindow } from "./api-windows.js";
import { tierPricing, tierEtbPricing } from "./api-partners.service.js";
import { ConflictError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import { postJournal } from "../financial-ledger/financial-ledger.service.js";

function invoiceNumber(partnerId, periodStart) {
  const digest = crypto.createHash("sha256").update(`${partnerId}:${periodStart.toISOString()}`).digest("hex").slice(0, 12).toUpperCase();
  return `API-${periodStart.toISOString().slice(0, 7).replace("-", "")}-${digest}`;
}

export function calculateUsageAmountMinor(requestCount, pricePer1000Minor) {
  return Math.ceil((Math.max(0, Number(requestCount) || 0) * Math.max(0, Number(pricePer1000Minor) || 0)) / 1000);
}

export async function recordPartnerBillingUsage(partner, now = new Date()) {
  const { start, end } = monthWindow(now);
  const prepaid = partner.billing_mode === "prepaid_etb";
  const pricePerThousandMinor = prepaid ? tierEtbPricing(partner.tier) : tierPricing(partner.tier);
  const billingCurrency = prepaid ? "etb" : "usd";
  try {
    const statement = await ApiBillingLedger.findOneAndUpdate(
      { partner_id: partner._id, period_start: start },
      {
        $inc: { request_count: 1 },
        $set: {
          period_end: end,
          price_per_1000_minor: pricePerThousandMinor,
          amount_minor: calculateUsageAmountMinor(1, pricePerThousandMinor),
        },
        $setOnInsert: {
          partner_id: partner._id,
          period_start: start,
          currency: billingCurrency,
          invoice_number: invoiceNumber(partner._id, start),
          status: "open",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    const amountMinor = calculateUsageAmountMinor(statement.request_count, pricePerThousandMinor);
    if (statement.amount_minor !== amountMinor) {
      await ApiBillingLedger.updateOne({ _id: statement._id }, { $set: { amount_minor: amountMinor } });
      statement.amount_minor = amountMinor;
    }
    return statement;
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const statement = await ApiBillingLedger.findOneAndUpdate(
      { partner_id: partner._id, period_start: start },
      { $inc: { request_count: 1 }, $set: { period_end: end, price_per_1000_minor: pricePerThousandMinor } },
      { new: true }
    ).lean();
    const amountMinor = calculateUsageAmountMinor(statement.request_count, pricePerThousandMinor);
    await ApiBillingLedger.updateOne({ _id: statement._id }, { $set: { amount_minor: amountMinor } });
    statement.amount_minor = amountMinor;
    return statement;
  }
}

function present(statement) {
  if (!statement) return null;
  return {
    ...statement,
    amount_minor: calculateUsageAmountMinor(statement.request_count, statement.price_per_1000_minor),
  };
}

export async function getPartnerBilling(partner, now = new Date()) {
  const { start, end } = monthWindow(now);
  const prepaid = partner.billing_mode === "prepaid_etb";
  const pricePerThousandMinor = prepaid ? tierEtbPricing(partner.tier) : tierPricing(partner.tier);
  const billingCurrency = prepaid ? "etb" : "usd";
  const statement = await ApiBillingLedger.findOne({ partner_id: partner._id, period_start: start }).lean();
  const history = await ApiBillingLedger.find({ partner_id: partner._id, period_start: { $ne: start } })
    .sort({ period_start: -1 }).limit(12).lean();
  if (!statement) {
    return {
      current: {
        partner_id: partner._id,
        period_start: start,
        period_end: end,
        currency: billingCurrency,
        status: "open",
        request_count: 0,
        price_per_1000_minor: pricePerThousandMinor,
        amount_minor: 0,
      },
      history: history.map(present),
    };
  }
  return { current: present(statement), history: history.map(present) };
}

export async function listPartnerBilling(partnerId, limit = 12) {
  const statements = await ApiBillingLedger.find({ partner_id: partnerId }).sort({ period_start: -1 }).limit(Math.min(24, Math.max(1, limit))).lean();
  return statements.map(present);
}

const BILLING_TRANSITIONS = {
  open: new Set(["issued", "void"]),
  issued: new Set(["paid", "failed", "overdue", "void"]),
  overdue: new Set(["paid", "failed", "void"]),
  failed: new Set(["issued", "void"]),
  paid: new Set(),
  void: new Set(),
};

export async function updatePartnerBillingStatus({ partnerId, ledgerId, status, settlement_reference, settlement_error, actor, req }) {
  const ledger = await ApiBillingLedger.findOne({ _id: ledgerId, partner_id: partnerId });
  if (!ledger) throw new NotFoundError("API billing statement not found");
  if (!BILLING_TRANSITIONS[ledger.status]?.has(status)) {
    throw new ConflictError(`Cannot move API billing statement from ${ledger.status} to ${status}`);
  }
  if (status === "failed" && !settlement_error) throw new ValidationError("A settlement error is required for failed invoices");
  const previousStatus = ledger.status;
  if (status === "paid" && !settlement_reference) throw new ValidationError("A settlement reference is required for paid invoices");
  const now = new Date();
  const update = {
    $set: {
      status,
      ...(status === "issued" ? { issued_at: ledger.issued_at || now } : {}),
      ...(status === "paid" ? { paid_at: now, settlement_reference } : {}),
      ...(status === "paid" ? { settlement_status: "confirmed" } : {}),
      ...(status === "failed" ? { settlement_status: "failed" } : {}),
      ...(status === "failed" ? { failed_at: now, settlement_error } : {}),
      ...(settlement_reference ? { settlement_reference } : {}),
    },
  };
  const updated = await ApiBillingLedger.findOneAndUpdate(
    { _id: ledger._id, partner_id: partnerId, status: previousStatus },
    update,
    { new: true }
  );
  if (!updated) throw new ConflictError("Billing statement changed before the status update completed");
  const currency = String(updated.currency || "usd").toLowerCase();
  const amountMinor = calculateUsageAmountMinor(updated.request_count, updated.price_per_1000_minor);
  const journalIds = Array.isArray(updated.ledger_journal_ids) ? [...updated.ledger_journal_ids] : [];
  if (status === "issued" && !journalIds.length) {
    const posted = await postJournal({
      eventType: "api.invoice.issued",
      idempotencyKey: `api-invoice-issued:${updated._id}`,
      sourceType: "api_billing_ledger",
      sourceId: updated._id,
      requestId: req?.requestId || req?.correlationId || "system",
      actorId: actor?._id || actor?.id,
      actorRole: actor?.role || "admin",
      entries: [
        { accountBase: "partner_receivable", debitMinor: amountMinor, creditMinor: 0, currency },
        { accountBase: "platform_revenue", debitMinor: 0, creditMinor: amountMinor, currency },
      ],
      metadata: { partnerId: String(partnerId), invoiceNumber: updated.invoice_number },
    });
    journalIds.push(String(posted.journal._id));
  }
  if (status === "paid") {
    const posted = await postJournal({
      eventType: "api.invoice.settled",
      idempotencyKey: `api-invoice-settled:${updated._id}`,
      sourceType: "api_billing_ledger",
      sourceId: updated._id,
      providerEventId: settlement_reference,
      requestId: req?.requestId || req?.correlationId || "system",
      actorId: actor?._id || actor?.id,
      actorRole: actor?.role || "admin",
      entries: [
        { accountBase: "provider_clearing", debitMinor: amountMinor, creditMinor: 0, currency },
        { accountBase: "partner_receivable", debitMinor: 0, creditMinor: amountMinor, currency },
      ],
      metadata: { partnerId: String(partnerId), invoiceNumber: updated.invoice_number, settlementReference: settlement_reference },
    });
    journalIds.push(String(posted.journal._id));
  }
  if (journalIds.length) {
    updated.ledger_journal_ids = [...new Set(journalIds)];
    updated.reconciliation_status = "reconciled";
    await updated.save();
  }
  await recordEvent({
    actor,
    eventType: "api_billing_status_updated",
    action: "api_billing.status_updated",
    entityType: "api_billing_ledger",
    entityId: ledger._id,
    previousState: { status: previousStatus },
    newState: { status, settlement_reference: updated.settlement_reference },
    metadata: { partner_id: String(partnerId), invoice_number: updated.invoice_number, settlement_error: updated.settlement_error },
    correlationId: req?.correlationId || req?.requestId || crypto.randomUUID(),
    requestId: req?.requestId,
  });
  return updated.toObject();
}
