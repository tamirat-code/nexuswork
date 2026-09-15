import crypto from "node:crypto";
import ApiBillingLedger from "./api-billing-ledger.model.js";
import { monthWindow } from "./api-windows.js";
import { tierPricing } from "./api-partners.service.js";

function invoiceNumber(partnerId, periodStart) {
  const digest = crypto.createHash("sha256").update(`${partnerId}:${periodStart.toISOString()}`).digest("hex").slice(0, 12).toUpperCase();
  return `API-${periodStart.toISOString().slice(0, 7).replace("-", "")}-${digest}`;
}

export function calculateUsageAmountMinor(requestCount, pricePer1000Minor) {
  return Math.ceil((Math.max(0, Number(requestCount) || 0) * Math.max(0, Number(pricePer1000Minor) || 0)) / 1000);
}

export async function recordPartnerBillingUsage(partner, now = new Date()) {
  const { start, end } = monthWindow(now);
  const pricePerThousandMinor = tierPricing(partner.tier);
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
          currency: "usd",
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
  const pricePerThousandMinor = tierPricing(partner.tier);
  const statement = await ApiBillingLedger.findOne({ partner_id: partner._id, period_start: start }).lean();
  const history = await ApiBillingLedger.find({ partner_id: partner._id, period_start: { $ne: start } })
    .sort({ period_start: -1 }).limit(12).lean();
  if (!statement) {
    return {
      current: {
        partner_id: partner._id,
        period_start: start,
        period_end: end,
        currency: "usd",
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
