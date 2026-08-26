import { isUniversityCohortSuppressed } from "../../src/modules/analytics/analytics.service.js";

describe("university analytics privacy threshold", () => {
  test("suppresses cohorts below the configured minimum", () => {
    expect(isUniversityCohortSuppressed(4, 5)).toBe(true);
  });

  test("allows a cohort at the configured minimum", () => {
    expect(isUniversityCohortSuppressed(5, 5)).toBe(false);
  });

  test("does not suppress larger cohorts", () => {
    expect(isUniversityCohortSuppressed(12, 5)).toBe(false);
  });
});
