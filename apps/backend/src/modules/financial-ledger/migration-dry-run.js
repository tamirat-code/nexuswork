import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../../config/database.config.js";
import { buildFinancialMigrationReport } from "./financial-ledger.migration.js";

await connectDB();
try {
  console.log(JSON.stringify(await buildFinancialMigrationReport(), null, 2));
} finally {
  await mongoose.disconnect();
}
