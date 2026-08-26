import Payment from "../payments/payments.model.js";
import Milestone from "../milestones/milestones.model.js";
import Withdrawal from "../wallets/withdrawal.model.js";
import Invoice from "../invoices/invoices.model.js";
import { moneyFromLegacyMajorUnits } from "../../shared/money/money.js";

async function inspectModel(Model, name, currencyField = "currency") {
  const report = { model: name, total: 0, missingMinor: 0, invalidLegacy: 0, mismatchedMinor: 0 };
  const cursor = Model.find({}).select("amount amount_minor currency").lean().cursor();
  for await (const record of cursor) {
    report.total += 1;
    if (Number.isSafeInteger(record.amount_minor)) {
      try {
        if (moneyFromLegacyMajorUnits(record.amount, record[currencyField] || "usd").amountMinor !== record.amount_minor) {
          report.mismatchedMinor += 1;
        }
      } catch {
        report.mismatchedMinor += 1;
      }
    } else {
      report.missingMinor += 1;
      try {
        moneyFromLegacyMajorUnits(record.amount, record[currencyField] || "usd");
      } catch {
        report.invalidLegacy += 1;
      }
    }
  }
  return report;
}

async function backfillModel(Model, name) {
  const report = { model: name, updated: 0, skipped: 0, invalid: 0 };
  const cursor = Model.find({ $or: [{ amount_minor: { $exists: false } }, { amount_minor: null }] })
    .select("amount amount_minor currency")
    .lean()
    .cursor();

  for await (const record of cursor) {
    try {
      const converted = moneyFromLegacyMajorUnits(record.amount, record.currency || "usd");
      const result = await Model.updateOne(
        { _id: record._id, $or: [{ amount_minor: { $exists: false } }, { amount_minor: null }] },
        { $set: { amount_minor: converted.amountMinor } }
      );
      if (result.modifiedCount === 1) report.updated += 1;
      else report.skipped += 1;
    } catch {
      report.invalid += 1;
    }
  }
  return report;
}

/** Read-only report. This function intentionally performs no writes. */
export async function buildFinancialMigrationReport() {
  return {
    mode: "dry-run",
    writable: false,
    generatedAt: new Date().toISOString(),
    records: await Promise.all([
      inspectModel(Payment, "Payment"),
      inspectModel(Milestone, "Milestone"),
      inspectModel(Withdrawal, "Withdrawal"),
      inspectModel(Invoice, "Invoice"),
    ]),
  };
}

/**
 * Additive migration only. Legacy major-unit fields are retained so existing
 * API consumers remain compatible. Existing minor-unit values are never
 * overwritten, and invalid records are reported rather than guessed.
 */
export async function backfillFinancialMinorUnits() {
  return {
    mode: "apply",
    writable: true,
    generatedAt: new Date().toISOString(),
    records: await Promise.all([
      backfillModel(Payment, "Payment"),
      backfillModel(Milestone, "Milestone"),
      backfillModel(Withdrawal, "Withdrawal"),
      backfillModel(Invoice, "Invoice"),
    ]),
  };
}
