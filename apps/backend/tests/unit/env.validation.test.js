import { buildEnv } from "../../src/config/env.js";
import { validateEnv } from "../../src/config/env.validation.js";

describe("centralized environment configuration", () => {
  test("normalizes numeric and provider values", () => {
    const config = buildEnv({
      NODE_ENV: "development",
      PORT: "5050",
      COMMISSION_RATE: "0.15",
      COMMISSION_WAIVER_MILESTONE_THRESHOLD: "4",
      STORAGE_DRIVER: "S3",
      AI_PROVIDER: "NONE",
    });

    expect(config.port).toBe(5050);
    expect(config.commissionRate).toBe(0.15);
    expect(config.storageDriver).toBe("s3");
    expect(config.aiProvider).toBe("none");
    expect(config.commissionWaiverMilestoneThreshold).toBe(4);
  });

  test("normalizes mail driver and SMTP settings", () => {
    const config = buildEnv({
      NODE_ENV: "development",
      MAIL_DRIVER: "SMTP",
      SMTP_PORT: "2525",
      SMTP_SECURE: "true",
    });

    expect(config.mailDriver).toBe("smtp");
    expect(config.smtpPort).toBe(2525);
    expect(config.smtpSecure).toBe(true);
  });

  test("rejects an unsupported mail driver", () => {
    const config = buildEnv({ NODE_ENV: "development", MAIL_DRIVER: "unknown" });
    expect(() => validateEnv(config)).toThrow(/Unsupported MAIL_DRIVER/);
  });

  test("rejects an invalid commission waiver threshold", () => {
    const config = buildEnv({ NODE_ENV: "development", COMMISSION_WAIVER_MILESTONE_THRESHOLD: "1.5" });
    expect(() => validateEnv(config)).toThrow(/COMMISSION_WAIVER_MILESTONE_THRESHOLD/);
  });

  test("rejects production configuration with missing required values", () => {
    const config = buildEnv({
      NODE_ENV: "production",
      AI_PROVIDER: "none",
      PAYMENT_PROVIDER: "stripe",
      STORAGE_DRIVER: "s3",
    });

    expect(() => validateEnv(config)).toThrow(/MONGO_URI/);
    expect(() => validateEnv(config)).toThrow(/JWT_SECRET/);
    expect(() => validateEnv(config)).toThrow(/STRIPE_SECRET_KEY/);
    expect(() => validateEnv(config)).toThrow(/S3_BUCKET/);
  });

  test("requires ETB and server-side Chapa configuration", () => {
    const config = buildEnv({
      NODE_ENV: "production",
      PAYMENT_PROVIDER: "chapa",
      PAYMENT_CURRENCY: "usd",
      AI_PROVIDER: "none",
      STORAGE_DRIVER: "s3",
    });
    expect(() => validateEnv(config)).toThrow(/CHAPA_SECRET_KEY/);
    expect(() => validateEnv(config)).toThrow(/PAYMENT_CURRENCY/);
  });

  test("requires SMTP credentials for production SMTP mail", () => {
    const config = buildEnv({
      NODE_ENV: "production",
      AI_PROVIDER: "none",
      PAYMENT_PROVIDER: "none",
      STORAGE_DRIVER: "s3",
      MAIL_DRIVER: "smtp",
    });

    expect(() => validateEnv(config)).toThrow(/SMTP_HOST/);
    expect(() => validateEnv(config)).toThrow(/SMTP_USER/);
    expect(() => validateEnv(config)).toThrow(/SMTP_PASS/);
    expect(() => validateEnv(config)).not.toThrow(/RESEND_API_KEY/);
  });

  test("rejects the simulated mail driver in production", () => {
    const config = buildEnv({ NODE_ENV: "production", MAIL_DRIVER: "log" });
    expect(() => validateEnv(config)).toThrow(/MAIL_DRIVER=log/);
  });
});
