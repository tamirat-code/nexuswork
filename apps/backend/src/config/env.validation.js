
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
