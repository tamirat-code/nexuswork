import { env } from "./env.js";

const SUPPORTED_AI_PROVIDERS = new Set(["none", "groq", "anthropic"]);
const SUPPORTED_PAYMENT_PROVIDERS = new Set(["none", "stripe", "chapa"]);
const SUPPORTED_STORAGE_DRIVERS = new Set(["local", "s3"]);
const SUPPORTED_FILE_SCAN_PROVIDERS = new Set(["none", "opswat"]);
const SUPPORTED_MAIL_DRIVERS = new Set(["resend", "smtp", "log"]);

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

  if (!SUPPORTED_MAIL_DRIVERS.has(config.mailDriver)) {
    throw new Error(`Unsupported MAIL_DRIVER: ${config.mailDriver}. Use resend, smtp, or log.`);
  }

  if (!SUPPORTED_PAYMENT_PROVIDERS.has(config.paymentProvider)) {
    throw new Error(`Unsupported PAYMENT_PROVIDER: ${config.paymentProvider}. Use none, stripe, or chapa.`);
  }
  if (config.paymentProvider === "stripe") {
    requireValue(missing, config.stripeSecretKey, "STRIPE_SECRET_KEY");
    requireValue(missing, config.stripeWebhookSecret, "STRIPE_WEBHOOK_SECRET");
  }
  if (config.paymentProvider === "chapa") {
    requireValue(missing, config.chapaSecretKey, "CHAPA_SECRET_KEY");
    requireValue(missing, config.chapaWebhookSecret, "CHAPA_WEBHOOK_SECRET");
    if (config.paymentCurrency !== "etb") missing.push("PAYMENT_CURRENCY (CHAPA requires ETB)");
    requireUrl(missing, config.chapaApiBaseUrl, "CHAPA_API_BASE_URL");
    requireUrl(missing, config.chapaCallbackUrl, "CHAPA_CALLBACK_URL");
    requireUrl(missing, config.chapaReturnUrl, "CHAPA_RETURN_URL");
  }

  if (!SUPPORTED_STORAGE_DRIVERS.has(config.storageDriver)) {
    throw new Error(`Unsupported STORAGE_DRIVER: ${config.storageDriver}. Use local or s3.`);
  }
  if (!SUPPORTED_FILE_SCAN_PROVIDERS.has(config.fileScanProvider)) {
    throw new Error(`Unsupported FILE_SCAN_PROVIDER: ${config.fileScanProvider}. Use none or opswat.`);
  }
  if (config.fileScanProvider !== "none") {
    requireValue(missing, config.opswatApiKey, "OPSWAT_API_KEY");
    requireUrl(missing, config.opswatApiBaseUrl, "OPSWAT_API_BASE_URL");
  }

  if (config.isProduction) {
    if (config.mailDriver === "log") {
      throw new Error("Production cannot use MAIL_DRIVER=log");
    }
    requireUrl(missing, config.clientUrl, "CLIENT_URL");
    requireValue(missing, config.credentialIssuerPrivateKey, "CREDENTIAL_ISSUER_PRIVATE_KEY");
    if (config.clientUrl === "*") missing.push("CLIENT_URL (wildcard is not allowed in production)");
    if (!config.clientUrls.length) missing.push("CLIENT_URLS (must contain at least one allowed browser origin)");
    for (const origin of config.clientUrls) {
      try {
        const parsed = new URL(origin);
        if (!/^https?:$/.test(parsed.protocol)) missing.push(`CLIENT_URLS origin is invalid: ${origin}`);
      } catch {
        missing.push(`CLIENT_URLS origin is invalid: ${origin}`);
      }
    }
    if (config.storageDriver === "local") {
      missing.push("STORAGE_DRIVER (production must use durable object storage, not local disk)");
    }
    if (config.storageDriver === "s3") {
      requireValue(missing, config.s3Bucket, "S3_BUCKET");
      requireValue(missing, config.s3AccessKey, "S3_ACCESS_KEY");
      requireValue(missing, config.s3SecretKey, "S3_SECRET_KEY");
    }
    if (config.fileScanProvider !== "opswat" || !config.opswatPrivateScan) {
      missing.push("FILE_SCAN_PROVIDER (production uploads require hosted malware scanning)");
    }
    if (config.mailDriver === "smtp") {
      requireValue(missing, config.smtpHost, "SMTP_HOST");
      requireValue(missing, config.smtpUser, "SMTP_USER");
      requireValue(missing, config.smtpPass, "SMTP_PASS");
    } else {
      requireValue(missing, config.resendApiKey, "RESEND_API_KEY");
    }
    requireValue(missing, config.recaptchaSecretKey, "RECAPTCHA_SECRET_KEY");
    if (config.mailFrom.includes("yourdomain.com")) missing.push("MAIL_FROM (replace the development placeholder)");
    if (config.stripeSecretKey?.startsWith("sk_test_")) {
      throw new Error("Production cannot use a Stripe test secret key (sk_test_*)");
    }
  }

  if (config.commissionRate < 0 || config.commissionRate >= 1) {
    throw new Error("COMMISSION_RATE must be between 0 and 1");
  }
  if (!Number.isInteger(config.commissionRateBps) || config.commissionRateBps < 0 || config.commissionRateBps >= 10000) {
    throw new Error("COMMISSION_RATE must resolve to basis points between 0 and 9999");
  }
  if (!Number.isInteger(config.commissionWaiverMilestoneThreshold) || config.commissionWaiverMilestoneThreshold < 0) {
    throw new Error("COMMISSION_WAIVER_MILESTONE_THRESHOLD must be a non-negative integer");
  }
  if (config.recaptchaMinScore < 0 || config.recaptchaMinScore > 1) {
    throw new Error("RECAPTCHA_MIN_SCORE must be between 0 and 1");
  }
  if (config.maxFileSizeMB <= 0) throw new Error("MAX_FILE_SIZE_MB must be greater than zero");

  if (config.webrtcTurnUrl && (!config.webrtcTurnUsername || !config.webrtcTurnCredential)) {
    missing.push("WEBRTC_TURN_USERNAME and WEBRTC_TURN_CREDENTIAL (required with WEBRTC_TURN_URL)");
  }
  if (config.isProduction && (!config.webrtcTurnUrl || !config.webrtcTurnUsername || !config.webrtcTurnCredential)) {
    missing.push("WEBRTC_TURN_URL, WEBRTC_TURN_USERNAME, and WEBRTC_TURN_CREDENTIAL (required for production meetings)");
  }

  if (missing.length > 0) {
    throw new Error(`Missing or invalid required environment variables: ${missing.join(", ")}`);
  }
}
