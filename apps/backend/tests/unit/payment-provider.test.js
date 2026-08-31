import { assertPaymentProvider, PaymentProviderError } from "../../src/modules/payments/providers/payment-provider.js";

const capabilities = [
  "createPaymentIntent",
  "getPaymentIntent",
  "createTransfer",
  "getTransfer",
  "createRefund",
  "getRefund",
  "createConnectedAccount",
  "getConnectedAccount",
  "createAccountLink",
  "createLoginLink",
  "getConnectedBalance",
  "createPayout",
  "verifyWebhook",
];

describe("payment provider contract", () => {
  it("requires every provider-neutral capability", () => {
    const provider = Object.fromEntries(capabilities.map((name) => [name, () => undefined]));
    expect(assertPaymentProvider(provider)).toBe(provider);
    expect(() => assertPaymentProvider({})).toThrow(/missing capability/);
  });

  it("normalizes provider failures without exposing SDK types to domain code", () => {
    const error = new PaymentProviderError("Provider unavailable", { code: "timeout", retryable: true });
    expect(error).toMatchObject({ name: "PaymentProviderError", code: "timeout", retryable: true });
  });
});
