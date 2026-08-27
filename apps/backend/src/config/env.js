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

function basisPoints(value, fallback) {
  const text = String(value ?? fallback);
  const match = text.match(/^(?:0|[1-9]\d*)(?:\.(\d{1,4}))?$/);
  if (!match) return fallback * 10000;
  return Number(text.split(".")[0]) * 10000 + Number((match[1] || "").padEnd(4, "0") || 0);
}
export function buildEnv(source = process.env) {
  return Object.freeze({
    nodeEnv: source.NODE_ENV || "development",
    isProduction: source.NODE_ENV === "production",
    isTest: source.NODE_ENV === "test",
    skipValidation: source.SKIP_ENV_VALIDATION === "true",
    port: number(source.PORT, 5000),
    apiPrefix: "/v1",

    mongoUri: optional(source.MONGO_URI),
    clientUrl: optional(source.CLIENT_URL),
    credentialIssuerUrl: optional(source.CREDENTIAL_ISSUER_URL) || "http://localhost:5000",
    credentialIssuerPrivateKey: optional(source.CREDENTIAL_ISSUER_PRIVATE_KEY),
    credentialIssuerPublicKey: optional(source.CREDENTIAL_ISSUER_PUBLIC_KEY),
    jwtSecret: optional(source.JWT_SECRET),
    jwtExpiresIn: source.JWT_EXPIRES_IN || "7d",

    googleClientId: optional(source.GOOGLE_CLIENT_ID),
    paymentProvider: (source.PAYMENT_PROVIDER || "stripe").toLowerCase(),
    stripeSecretKey: optional(source.STRIPE_SECRET_KEY),
    stripeWebhookSecret: optional(source.STRIPE_WEBHOOK_SECRET),
    paymentCurrency: (source.PAYMENT_CURRENCY || "usd").toLowerCase(),
    commissionRate: number(source.COMMISSION_RATE, 0.1),
    commissionRateBps: basisPoints(source.COMMISSION_RATE, 0.1),
    commissionWaiverMilestoneThreshold: number(source.COMMISSION_WAIVER_MILESTONE_THRESHOLD, 3),
    stripeConnectRefreshUrl: source.STRIPE_CONNECT_REFRESH_URL || "http://localhost:5173/wallet?connect=refresh",
    stripeConnectReturnUrl: source.STRIPE_CONNECT_RETURN_URL || "http://localhost:5173/wallet?connect=done",
    chapaApiBaseUrl: source.CHAPA_API_BASE_URL || "https://api.chapa.co/v1",
    chapaSecretKey: optional(source.CHAPA_SECRET_KEY),
    chapaWebhookSecret: optional(source.CHAPA_WEBHOOK_SECRET),
    chapaCallbackUrl: optional(source.CHAPA_CALLBACK_URL),
    chapaReturnUrl: optional(source.CHAPA_RETURN_URL),
    chapaRequestTimeoutMs: number(source.CHAPA_REQUEST_TIMEOUT_MS, 10000),

    aiProvider: (source.AI_PROVIDER || "anthropic").toLowerCase(),
    aiApiKey: optional(source.AI_API_KEY),
    aiModel: optional(source.AI_MODEL),

    resendApiKey: optional(source.RESEND_API_KEY),
    mailFrom: source.MAIL_FROM || "NexusWork <no-reply@yourdomain.com>",
    termsVersion: source.TERMS_VERSION || "1.0",
    recaptchaSecretKey: optional(source.RECAPTCHA_SECRET_KEY),
    recaptchaMinScore: number(source.RECAPTCHA_MIN_SCORE, 0.5),

    storageDriver: (source.STORAGE_DRIVER || "local").toLowerCase(),
    uploadDir: source.UPLOAD_DIR || "uploads",
    maxFileSizeMB: number(source.MAX_FILE_SIZE_MB, 20),
    s3Region: source.S3_REGION || source.AWS_REGION || "us-east-1",
    s3Endpoint: optional(source.S3_ENDPOINT),
    s3Bucket: optional(source.S3_BUCKET),
    s3AccessKey: optional(source.S3_ACCESS_KEY),
    s3SecretKey: optional(source.S3_SECRET_KEY),
    s3ForcePathStyle: boolean(source.S3_FORCE_PATH_STYLE),

    logLevel: source.LOG_LEVEL || "info",
    analyticsMinCohortSize: Math.max(1, Math.floor(number(source.ANALYTICS_MIN_COHORT_SIZE, 5))),
  });
}

export const env = buildEnv();
