import crypto from "node:crypto";
import { jest } from "@jest/globals";
import { chapaProvider } from "../../src/modules/payments/providers/chapa.provider.js";
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

  test("lists supported bank and mobile wallet destinations", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success", data: [
        { bank_code: 656, name: "Commercial Bank of Ethiopia" },
        { code: 777, bank_name: "Telebirr", type: "mobile_wallet" },
        { bank_code: 999 },
      ] }),
    });

    await expect(chapaProvider.listBanks()).resolves.toEqual([
      { code: "656", name: "Commercial Bank of Ethiopia", type: "bank" },
      { code: "777", name: "Telebirr", type: "mobile_wallet" },
    ]);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/banks"), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: expect.stringContaining("Bearer ") }),
    }));
  });

  test("rejects non-ETB money and unsupported payout capabilities", async () => {
    await expect(chapaProvider.createPaymentIntent({ amountMinor: 100, currency: "usd", idempotencyKey: "funding-123" }))
      .rejects.toMatchObject({ code: "currency_mismatch" });
    expect(() => chapaProvider.createPayout()).toThrow(/does not support payouts/);
  });

  test("creates and verifies an ETB refund", async () => {
    jest.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "success", data: { ref_id: "rf_test_123", status: "initiated" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "success", data: { ref_id: "rf_test_123", status: "refunded" } }),
      });

    await expect(chapaProvider.createRefund({
      paymentIntentId: "tx_test_123",
      amountMinor: 2500,
      currency: "etb",
      idempotencyKey: "milestone-refund-test-123",
    })).resolves.toMatchObject({ id: "rf_test_123", status: "pending" });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/refund/tx_test_123"), expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "Content-Type": "application/x-www-form-urlencoded" }),
    }));

    await expect(chapaProvider.getRefund("rf_test_123"))
      .resolves.toMatchObject({ id: "rf_test_123", status: "succeeded" });
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

  test("creates and verifies an ETB transfer", async () => {
    jest.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "success", data: { reference: "tr_test_123", status: "pending" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "success", data: { reference: "tr_test_123", status: "success" } }),
      });

    await expect(chapaProvider.createTransfer({
      amountMinor: 2500,
      currency: "etb",
      destination: { bankCode: "656", accountName: "Test Student", accountNumber: "123456789" },
      idempotencyKey: "milestone-release-test-123",
    })).resolves.toMatchObject({ id: "tr_test_123", status: "pending" });

    await expect(chapaProvider.getTransfer("tr_test_123"))
      .resolves.toMatchObject({ id: "tr_test_123", status: "succeeded" });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
      amount: "25",
      currency: "ETB",
      bank_code: 656,
      account_number: "123456789",
      reference: "milestone-release-test-123",
    });
  });

  test("accepts Chapa transfer references returned as a string", async () => {
    jest.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "success", message: "Transfer queued successfully", data: "tr_test_string" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "success", data: { reference: "tr_test_string", status: "success" } }),
      });

    await expect(chapaProvider.createTransfer({
      amountMinor: 2500,
      currency: "etb",
      destination: { bankCode: "656", accountName: "Test Student", accountNumber: "123456789" },
      idempotencyKey: "milestone-release-string-test",
    })).resolves.toMatchObject({
      id: "tr_test_string",
      status: "pending",
      providerStatus: "success",
    });

    await expect(chapaProvider.getTransfer("tr_test_string"))
      .resolves.toMatchObject({ id: "tr_test_string", status: "succeeded", providerStatus: "success" });
  });

  test("uses the top-level provider status for string verification responses", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success", data: "tr_test_verified_string" }),
    });

    await expect(chapaProvider.getTransfer("tr_test_verified_string"))
      .resolves.toMatchObject({
        id: "tr_test_verified_string",
        status: "succeeded",
        providerStatus: "success",
      });
  });

  test("uses the provider transfer id instead of a local fallback reference", async () => {
    jest.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "success", data: { id: "chapa-transfer-123", status: "queued" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "success", data: { id: "chapa-transfer-123", status: "success" } }),
      });

    await expect(chapaProvider.createTransfer({
      amountMinor: 2500,
      currency: "etb",
      destination: { bankCode: "656", accountName: "Test Student", accountNumber: "123456789" },
      idempotencyKey: "milestone-release-provider-id",
    })).resolves.toMatchObject({ id: "chapa-transfer-123", status: "pending" });

    await expect(chapaProvider.getTransfer("chapa-transfer-123"))
      .resolves.toMatchObject({ id: "chapa-transfer-123", status: "succeeded" });
    expect(fetch.mock.calls[1][0]).toContain("/transfers/verify/chapa-transfer-123");
  });

  test("prefers Chapa's provider reference over the merchant reference", async () => {
    jest.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "success", data: {
          reference: "nw-merchant-reference",
          chapa_reference: "chapa-transfer-456",
          status: "queued",
        } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "success", data: {
          chapa_reference: "chapa-transfer-456",
          status: "success",
        } }),
      });

    await expect(chapaProvider.createTransfer({
      amountMinor: 2500,
      currency: "etb",
      destination: { bankCode: "656", accountName: "Test Student", accountNumber: "123456789" },
      idempotencyKey: "milestone-release-provider-reference",
    })).resolves.toMatchObject({ id: "chapa-transfer-456", status: "pending" });

    await expect(chapaProvider.getTransfer("chapa-transfer-456"))
      .resolves.toMatchObject({ id: "chapa-transfer-456", status: "succeeded" });
    expect(fetch.mock.calls[1][0]).toContain("/transfers/verify/chapa-transfer-456");
  });
});
