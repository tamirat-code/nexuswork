import mongoose from "mongoose";
import { connectDB } from "../../src/config/database.config.js";


export async function connectTestDB() {
  if (mongoose.connection.readyState === 1) return;

  const uri = process.env.MONGO_URI || "";
  const dbName = uri.split("/").pop()?.split("?")[0] || "";

  if (!dbName.includes("test")) {
    throw new Error(
      `Refusing to run DB-backed tests against MONGO_URI="${uri}". ` +
        `Point MONGO_URI at a database whose name contains "test" ` +
        `(e.g. mongodb://localhost:27017/nexuswork_test) before running this suite — ` +
        `clearDB() deletes all documents in every collection between tests.`
    );
  }

  await connectDB();
}

export async function clearDB() {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

export async function disconnectTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}