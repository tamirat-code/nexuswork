import { money, moneyFromLegacyMajorUnits, moneyFromRecord } from "../../src/shared/money/money.js";

describe("canonical money boundary", () => {
  it("represents amounts as integer minor units and currency", () => {
    expect(moneyFromLegacyMajorUnits("250.50", "USD")).toEqual({ amountMinor: 25050, currency: "usd" });
    expect(money(125, "EUR")).toEqual({ amountMinor: 125, currency: "eur" });
  });

  it("prefers a persisted minor-unit value over a legacy major-unit value", () => {
    expect(moneyFromRecord({ amount: 999, amount_minor: 1250, currency: "usd" })).toEqual({
      amountMinor: 1250,
      currency: "usd",
    });
  });

  it("rejects ambiguous legacy precision", () => {
    expect(() => moneyFromLegacyMajorUnits("10.999", "usd")).toThrow(/at most two decimal places/);
  });
});
