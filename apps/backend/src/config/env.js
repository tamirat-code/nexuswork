const raw = process.env;

function optional(value) {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}


export const env = Object.freeze({
  nodeEnv: raw.NODE_ENV || "development",
  isProduction: raw.NODE_ENV === "production",
  isTest: raw.NODE_ENV === "test",
  skipValidation: raw.SKIP_ENV_VALIDATION === "true",
  port: number(raw.PORT, 5000),
  apiPrefix: "/v1",

  mongoUri: optional(raw.MONGO_URI),
  clientUrl: optional(raw.CLIENT_URL),
  jwtSecret: optional(raw.JWT_SECRET),
  jwtExpiresIn: raw.JWT_EXPIRES_IN || "7d",

  googleClientId: optional(raw.GOOGLE_CLIENT_ID),
  paymentProvider: (raw.PAYMENT_PROVIDER || "stripe").toLowerCase(),
  stripeSecretKey: optional(raw.STRIPE_SECRET_KEY),
  stripeWebhookSecret: optional(raw.STRIPE_WEBHOOK_SECRET),
  paymentCurrency: (raw.PAYMENT_CURRENCY || "usd").toLowerCase(),
  commissionRate: number(raw.COMMISSION_RATE, 0.1),
  stripeConnectRefreshUrl: raw.STRIPE_CONNECT_REFRESH_URL || "http://localhost:5173/wallet?connect=refresh",
  stripeConnectReturnUrl: raw.STRIPE_CONNECT_RETURN_URL || "http://localhost:5173/wallet?connect=done",

  aiProvider: (raw.AI_PROVIDER || "anthropic").toLowerCase(),
  aiApiKey: optional(raw.AI_API_KEY),
  aiModel: optional(raw.AI_MODEL),

  resendApiKey: optional(raw.RESEND_API_KEY),
  mailFrom: raw.MAIL_FROM || "NexusWork <no-reply@yourdomain.com>",
  termsVersion: raw.TERMS_VERSION || "1.0",
  recaptchaSecretKey: optional(raw.RECAPTCHA_SECRET_KEY),
  recaptchaMinScore: number(raw.RECAPTCHA_MIN_SCORE, 0.5),

  storageDriver: (raw.STORAGE_DRIVER || "local").toLowerCase(),
  uploadDir: raw.UPLOAD_DIR || "uploads",
  maxFileSizeMB: number(raw.MAX_FILE_SIZE_MB, 20),
  s3Region: raw.S3_REGION || raw.AWS_REGION || "us-east-1",
  s3Endpoint: optional(raw.S3_ENDPOINT),
  s3Bucket: optional(raw.S3_BUCKET),
  s3AccessKey: optional(raw.S3_ACCESS_KEY),
  s3SecretKey: optional(raw.S3_SECRET_KEY),
  s3ForcePathStyle: boolean(raw.S3_FORCE_PATH_STYLE),

  logLevel: raw.LOG_LEVEL || "info",
});
