import {
  createApiKeyMaterial, hashApiKey, parseApiKey, tierLimits,
} from "../../src/modules/api-partners/api-partners.service.js";
import { monthWindow, minuteWindow } from "../../src/modules/api-partners/api-usage.service.js";
import { calculateUsageAmountMinor } from "../../src/modules/api-partners/api-billing.service.js";
import { decryptWebhookSecret, encryptWebhookSecret } from "../../src/modules/api-partners/webhook-secrets.js";

describe("enterprise API partner credentials", () => {
  test("creates parseable high-entropy key material without exposing a hash", () => {
    const first = createApiKeyMaterial();
    const second = createApiKeyMaterial();

    expect(first.key).not.toBe(second.key);
    expect(first.keyPrefix).not.toBe(second.keyPrefix);
    expect(parseApiKey(first.key)).toEqual({ keyPrefix: first.keyPrefix, key: first.key });
    expect(hashApiKey(first.key)).toHaveLength(64);
    expect(hashApiKey(first.key)).not.toBe(first.key);
  });

  test("rejects malformed and short credentials", () => {
    expect(parseApiKey(undefined)).toBeNull();
    expect(parseApiKey("Bearer browser-session-token")).toBeNull();
    expect(parseApiKey("nw_short_secret")).toBeNull();
  });

  test("exposes the configured tier limits", () => {
    expect(tierLimits("sandbox")).toEqual({ monthlyQuota: 10_000, requestsPerMinute: 60 });
    expect(tierLimits("growth")).toEqual({ monthlyQuota: 100_000, requestsPerMinute: 300 });
    expect(tierLimits("enterprise")).toEqual({ monthlyQuota: 1_000_000, requestsPerMinute: 1_200 });
    expect(tierLimits("unknown")).toEqual(tierLimits("sandbox"));
  });

  test("uses UTC month and minute windows for distributed counters", () => {
    const value = new Date("2026-09-15T06:40:35.000Z");
    expect(monthWindow(value)).toEqual({
      start: new Date("2026-09-01T00:00:00.000Z"),
      end: new Date("2026-10-01T00:00:00.000Z"),
    });
    expect(minuteWindow(value)).toEqual({
      start: new Date("2026-09-15T06:40:00.000Z"),
      end: new Date("2026-09-15T06:41:00.000Z"),
    });
  });

  test("calculates usage billing in minor currency units and rounds up partial thousands", () => {
    expect(calculateUsageAmountMinor(0, 100)).toBe(0);
    expect(calculateUsageAmountMinor(1, 100)).toBe(1);
    expect(calculateUsageAmountMinor(1000, 75)).toBe(75);
    expect(calculateUsageAmountMinor(1001, 75)).toBe(76);
  });

  test("encrypts webhook secrets without storing the plaintext", () => {
    const secret = "whsec_test_secret_value";
    const encrypted = encryptWebhookSecret(secret);
    expect(encrypted).not.toContain(secret);
    expect(decryptWebhookSecret(encrypted)).toBe(secret);
  });
});
