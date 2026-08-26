import crypto from "node:crypto";
import { jest } from "@jest/globals";
import { chapaProvider } from "../../src/modules/payments/providers/chapa.provider.js";
import { PaymentProviderError } from "../../src/modules/payments/providers/payment-provider.js";
import { paymentConfig } from "../../src/config/payment.config.js";

describe("Chapa provider contract", () => {
  afterEach(() => jest.restoreAllMocks());

  test("initializes canonical ETB money as a hosted checkout", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success", data: { checkout_url: "https://checkout.example", tx_ref: "funding-123" } }),
    });
    await expect(chapaProvider.createPaymentIntent({ amountMinor: 1250, currency: "etb", idempotencyKey: "funding-123" }))
      .resolves.toMatchObject({ id: "funding-123", clientSecret: "https://checkout.example", status: "pending" });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/transaction/initialize"), expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ amount: "12.5", currency: "ETB", tx_ref: "funding-123" });
  });

  test("rejects non-ETB money and unsupported payout/refund capabilities", async () => {
    await expect(chapaProvider.createPaymentIntent({ amountMinor: 100, currency: "usd", idempotencyKey: "funding-123" }))
      .rejects.toMatchObject({ code: "currency_mismatch" });
    expect(() => chapaProvider.createRefund()).toThrow(PaymentProviderError);
    expect(() => chapaProvider.createPayout()).toThrow(/does not support payouts/);
  });

  test("verifies payload HMAC signatures", () => {
    const payload = { event: "charge.success", tx_ref: "funding-123" };
    const secret = paymentConfig.chapaWebhookSecret || "";
    const signature = crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
    expect(chapaProvider.verifyWebhook(payload, signature)).toEqual(payload);
    expect(() => chapaProvider.verifyWebhook(payload, "invalid")).toThrow(/signature verification failed/);
  });

  test.each([null, undefined, "NaN", "Infinity", "-1", "9007199254740992", {}, []])
    ("rejects malformed provider amount %p", async (amount) => {
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ data: { tx_ref: "funding-123", status: "success", currency: "ETB", amount } }),
      });
      await expect(chapaProvider.getPaymentIntent("funding-123"))
        .rejects.toMatchObject({ code: "malformed_response" });
      jest.restoreAllMocks();
    });

  test("rejects a provider currency mismatch", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { tx_ref: "funding-123", status: "success", currency: "USD", amount: "10.00" } }),
    });
    await expect(chapaProvider.getPaymentIntent("funding-123"))
      .rejects.toMatchObject({ code: "currency_mismatch" });
  });
});
