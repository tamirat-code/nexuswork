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

/**
 * Run critical financial projections in a MongoDB transaction when the
 * connected server supports replica-set transactions. Local standalone Mongo
 * remains usable for non-transactional development/tests; Docker development
 * uses the single-node rs0 replica set configured in docker-compose.yml.
 */
export async function withMongoTransaction(work) {
  const session = await mongoose.startSession();
  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    if (!hello.setName) return work(undefined);

    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
