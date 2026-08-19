import mongoose from "mongoose";
import dotenv from "dotenv";
import Contract from "./src/modules/contracts/contracts.model.js";

dotenv.config();

const CONTRACT_ID = "6a84c93575884d6ef69ab1e5";

try {
  await mongoose.connect(process.env.MONGO_URI);

  const result = await Contract.updateOne(
    { _id: CONTRACT_ID },
    {
      $set: {
        status: "pending_review",

        client_review: null,
        student_review: null,

        client_signature: null,
        student_signature: null,

        client_signed_at: null,
        student_signed_at: null,
        signed_at: null,
      },
    }
  );

  console.log("Contract reset:", result);

  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error("Failed to reset contract:", error);
  await mongoose.disconnect();
  process.exit(1);
}