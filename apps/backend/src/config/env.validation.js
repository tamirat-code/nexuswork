
export function validateEnv() {

  if (process.env.NODE_ENV === "test" || process.env.SKIP_ENV_VALIDATION === "true") {
    return;
  }

  const missing = [];

  if (!process.env.MONGO_URI) missing.push("MONGO_URI");
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");

  
  if (process.env.NODE_ENV === "production") {
    if (!process.env.CLIENT_URL || process.env.CLIENT_URL === "*") {
      missing.push("CLIENT_URL (must be set to the allowed origin in production)");
    }
    if ((process.env.STORAGE_DRIVER || "local").toLowerCase() === "local") {
      missing.push("STORAGE_DRIVER (production must use durable object storage, not local disk)");
    }
    if ((process.env.STORAGE_DRIVER || "local").toLowerCase() === "s3") {
      if (!process.env.S3_BUCKET) missing.push("S3_BUCKET");
      if (!process.env.S3_ACCESS_KEY) missing.push("S3_ACCESS_KEY");
      if (!process.env.S3_SECRET_KEY) missing.push("S3_SECRET_KEY");
    }
    if ((process.env.PAYMENT_PROVIDER || "").toLowerCase() === "stripe" && String(process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_")) {
      throw new Error("Production cannot use a Stripe test secret key (sk_test_*)");
    }
    const aiProvider = (process.env.AI_PROVIDER || "none").toLowerCase();
    if (!["none", "groq", "anthropic"].includes(aiProvider)) {
      throw new Error(`Unsupported AI_PROVIDER: ${aiProvider}. Use none, groq, or anthropic.`);
    }
  }


  if ((process.env.PAYMENT_PROVIDER || "").toLowerCase() === "stripe") {
    if (!process.env.STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
    if (!process.env.STRIPE_WEBHOOK_SECRET) missing.push("STRIPE_WEBHOOK_SECRET");
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long for production use");
  }
}