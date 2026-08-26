import { canTransitionPaymentStatus, transitionPaymentStatus } from "../../src/modules/payments/payment-state.js";

describe("payment state transitions", () => {
  test.each([
    ["created", "pending"],
    ["pending", "ledger_pending"],
    ["ledger_pending", "succeeded"],
    ["pending", "failed"],
    ["failed", "pending"],
  ])("allows %s -> %s", (from, to) => {
    expect(canTransitionPaymentStatus(from, to)).toBe(true);
  });

  test.each([
    ["failed", "succeeded"],
    ["succeeded", "failed"],
    ["succeeded", "pending"],
    ["created", "succeeded"],
  ])("rejects %s -> %s", (from, to) => {
    expect(() => transitionPaymentStatus({ status: from }, to)).toThrow(/Illegal payment status transition/);
  });

  test("allows repeated processing of the same state", () => {
    const payment = { status: "succeeded" };
    expect(transitionPaymentStatus(payment, "succeeded")).toBe(payment);
  });
});
