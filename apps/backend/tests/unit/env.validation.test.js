import { buildEnv } from "../../src/config/env.js";
import { validateEnv } from "../../src/config/env.validation.js";

describe("centralized environment configuration", () => {
  test("normalizes numeric and provider values", () => {
    const config = buildEnv({
      NODE_ENV: "development",
      PORT: "5050",
      COMMISSION_RATE: "0.15",
      STORAGE_DRIVER: "S3",
      AI_PROVIDER: "NONE",
    });

    expect(config.port).toBe(5050);
    expect(config.commissionRate).toBe(0.15);
    expect(config.storageDriver).toBe("s3");
    expect(config.aiProvider).toBe("none");
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
});
