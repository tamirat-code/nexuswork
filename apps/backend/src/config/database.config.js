import mongoose from "mongoose";
import { ensurePaymentIndexes, ensureWithdrawalIndexes } from "./database.indexes.js";
import { env } from "./env.js";

export async function connectDB() {
  const uri = env.mongoUri;
  if (!uri) throw new Error("MONGO_URI is not set in the environment");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  const indexResult = await ensureWithdrawalIndexes();
  const paymentIndexResult = await ensurePaymentIndexes();
  console.log(`[db] Withdrawal migration: backfilled=${indexResult.backfilled}, removed=${indexResult.removed.map((index) => index.name).join(",") || "none"}, compound=${indexResult.created}`);
  console.log(`[db] Payment provider indexes: ${paymentIndexResult.indexes.join(",")}, changed=${paymentIndexResult.changed}`);
  console.log("[db] MongoDB connected");
}
