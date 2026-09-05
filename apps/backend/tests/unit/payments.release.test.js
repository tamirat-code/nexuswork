import { jest } from "@jest/globals";
import { fileURLToPath } from "node:url";

const provider = {
  getTransfer: jest.fn(),
  createTransfer: jest.fn(),
};
const payment = {
  milestone_id: "milestone-1",
  amount: 90,
  amount_minor: 9000,
  currency: "etb",
  direction: "release",
  status: "pending",
  provider: "chapa",
  provider_payment_id: "chapa-transfer-old",
  provider_reference: "chapa-transfer-old",
  provider_operation_key: "milestone-release-milestone-1",
  save: jest.fn(),
};

const paymentsModelModule = fileURLToPath(new URL("../../src/modules/payments/payments.model.js", import.meta.url));
const providersModule = fileURLToPath(new URL("../../src/modules/payments/providers/index.js", import.meta.url));
const auditLogsModule = fileURLToPath(new URL("../../src/modules/audit-logs/audit-logs.service.js", import.meta.url));

jest.unstable_mockModule(paymentsModelModule, () => ({
  default: { findOne: jest.fn() },
}));
jest.unstable_mockModule(providersModule, () => ({
  getPaymentProvider: jest.fn(() => provider),
  paymentProvider: provider,
}));
jest.unstable_mockModule(auditLogsModule, () => ({
  logAction: jest.fn(),
}));

const { default: Payment } = await import(paymentsModelModule);
const { releaseToStudent } = await import("../../src/modules/payments/payments.service.js");

describe("release retry provider transfer protection", () => {
  beforeEach(() => {
    Object.assign(payment, {
      status: "pending",
      provider_payment_id: "chapa-transfer-old",
      provider_reference: "chapa-transfer-old",
    });
    payment.save.mockClear();
    provider.getTransfer.mockReset();
    provider.createTransfer.mockReset();
    Payment.findOne.mockReset();
    Payment.findOne.mockResolvedValue(payment);
  });

  test("reconciles an existing successful transfer without creating another", async () => {
    provider.getTransfer.mockResolvedValue({
      id: "chapa-transfer-old",
      status: "succeeded",
      providerStatus: "success",
    });

    const result = await releaseToStudent({
      milestoneId: "milestone-1",
      amount: 90,
      amountMinor: 9000,
      currency: "etb",
      chapaPayoutDestination: { bankCode: "656", accountName: "Student", accountNumber: "123" },
    });

    expect(result.status).toBe("succeeded");
    expect(provider.getTransfer).toHaveBeenCalledWith("chapa-transfer-old");
    expect(provider.createTransfer).not.toHaveBeenCalled();
  });

  test("keeps an existing pending transfer pending without creating another", async () => {
    provider.getTransfer.mockResolvedValue({
      id: "chapa-transfer-old",
      status: "pending",
      providerStatus: "queued",
    });

    const result = await releaseToStudent({
      milestoneId: "milestone-1",
      amount: 90,
      amountMinor: 9000,
      currency: "etb",
      chapaPayoutDestination: { bankCode: "656", accountName: "Student", accountNumber: "123" },
    });

    expect(result.status).toBe("pending");
    expect(provider.createTransfer).not.toHaveBeenCalled();
  });

  test("keeps an existing transfer pending when verification fails", async () => {
    provider.getTransfer.mockRejectedValue(new Error("provider verification unavailable"));

    const result = await releaseToStudent({
      milestoneId: "milestone-1",
      amount: 90,
      amountMinor: 9000,
      currency: "etb",
      chapaPayoutDestination: { bankCode: "656", accountName: "Student", accountNumber: "123" },
    });

    expect(result.status).toBe("pending");
    expect(provider.createTransfer).not.toHaveBeenCalled();
  });

  test("retries only after a definitive existing transfer failure", async () => {
    provider.getTransfer
      .mockResolvedValueOnce({ id: "chapa-transfer-old", status: "failed", providerStatus: "cancelled" })
      .mockResolvedValueOnce({ id: "chapa-transfer-new", status: "succeeded", providerStatus: "success" });
    provider.createTransfer.mockResolvedValue({
      id: "chapa-transfer-new",
      status: "pending",
      providerStatus: "queued",
    });

    const result = await releaseToStudent({
      milestoneId: "milestone-1",
      amount: 90,
      amountMinor: 9000,
      currency: "etb",
      chapaPayoutDestination: { bankCode: "656", accountName: "Student", accountNumber: "123" },
    });

    expect(result.status).toBe("succeeded");
    expect(provider.createTransfer).toHaveBeenCalledTimes(1);
    expect(provider.createTransfer).toHaveBeenCalledWith(expect.objectContaining({
      idempotencyKey: "milestone-release-milestone-1",
    }));
    expect(provider.getTransfer).toHaveBeenNthCalledWith(1, "chapa-transfer-old");
    expect(provider.getTransfer).toHaveBeenNthCalledWith(2, "chapa-transfer-new");
    expect(payment.provider_payment_id).toBe("chapa-transfer-new");
  });
});
