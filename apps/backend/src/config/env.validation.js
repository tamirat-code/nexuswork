import { env } from "./env.js";

const SUPPORTED_AI_PROVIDERS = new Set(["none", "groq", "anthropic"]);
const SUPPORTED_PAYMENT_PROVIDERS = new Set(["none", "stripe"]);
const SUPPORTED_STORAGE_DRIVERS = new Set(["local", "s3"]);

function requireValue(missing, value, name) {
  if (!value) missing.push(name);
}

function requireUrl(missing, value, name) {
  if (!value) {
    missing.push(name);
    return;
  }
  try {
    new URL(value);
  } catch {
    missing.push(`${name} (must be a valid URL)`);
  }
}

/** Validate startup configuration without exposing secret values. */
export function validateEnv(config = env) {
  if (config.isTest || config.skipValidation) return;

  const missing = [];
  requireValue(missing, config.mongoUri, "MONGO_URI");
  requireValue(missing, config.jwtSecret, "JWT_SECRET");

  if (config.jwtSecret && config.jwtSecret.length < 32) {
    missing.push("JWT_SECRET (must be at least 32 characters)");
  }

  if (!SUPPORTED_AI_PROVIDERS.has(config.aiProvider)) {
    throw new Error(`Unsupported AI_PROVIDER: ${config.aiProvider}. Use none, groq, or anthropic.`);
  }
  if (config.aiProvider !== "none") requireValue(missing, config.aiApiKey, "AI_API_KEY");

  if (!SUPPORTED_PAYMENT_PROVIDERS.has(config.paymentProvider)) {
    throw new Error(`Unsupported PAYMENT_PROVIDER: ${config.paymentProvider}. Use none or stripe.`);
  }
  if (config.paymentProvider === "stripe") {
    requireValue(missing, config.stripeSecretKey, "STRIPE_SECRET_KEY");
    requireValue(missing, config.stripeWebhookSecret, "STRIPE_WEBHOOK_SECRET");
  }

  if (!SUPPORTED_STORAGE_DRIVERS.has(config.storageDriver)) {
    throw new Error(`Unsupported STORAGE_DRIVER: ${config.storageDriver}. Use local or s3.`);
  }

  if (config.isProduction) {
    requireUrl(missing, config.clientUrl, "CLIENT_URL");
    if (config.clientUrl === "*") missing.push("CLIENT_URL (wildcard is not allowed in production)");
    if (config.storageDriver === "local") {
      missing.push("STORAGE_DRIVER (production must use durable object storage, not local disk)");
    }
    if (config.storageDriver === "s3") {
      requireValue(missing, config.s3Bucket, "S3_BUCKET");
      requireValue(missing, config.s3AccessKey, "S3_ACCESS_KEY");
      requireValue(missing, config.s3SecretKey, "S3_SECRET_KEY");
    }
    requireValue(missing, config.resendApiKey, "RESEND_API_KEY");
    requireValue(missing, config.recaptchaSecretKey, "RECAPTCHA_SECRET_KEY");
    if (config.mailFrom.includes("yourdomain.com")) missing.push("MAIL_FROM (replace the development placeholder)");
    if (config.stripeSecretKey?.startsWith("sk_test_")) {
      throw new Error("Production cannot use a Stripe test secret key (sk_test_*)");
    }
  }

  if (config.commissionRate < 0 || config.commissionRate >= 1) {
    throw new Error("COMMISSION_RATE must be between 0 and 1");
  }
  if (config.recaptchaMinScore < 0 || config.recaptchaMinScore > 1) {
    throw new Error("RECAPTCHA_MIN_SCORE must be between 0 and 1");
  }
  if (config.maxFileSizeMB <= 0) throw new Error("MAX_FILE_SIZE_MB must be greater than zero");

  if (missing.length > 0) {
    throw new Error(`Missing or invalid required environment variables: ${missing.join(", ")}`);
  }
}
