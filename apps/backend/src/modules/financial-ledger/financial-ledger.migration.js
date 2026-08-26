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
