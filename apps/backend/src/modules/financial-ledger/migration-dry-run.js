import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../config/database.config.js";
import { buildFinancialMigrationReport } from "./financial-ledger.migration.js";
import { backfillFinancialMinorUnits } from "./financial-ledger.migration.js";

await connectDB();
try {
  const apply = process.argv.includes("--apply");
  if (apply && process.env.MIGRATION_APPROVED !== "true") {
    throw new Error("Refusing to write financial records. Set MIGRATION_APPROVED=true with --apply after reviewing the dry-run report.");
  }
  console.log(JSON.stringify(
    apply ? await backfillFinancialMinorUnits() : await buildFinancialMigrationReport(),
    null,
    2
  ));
} finally {
  await mongoose.disconnect();
}
