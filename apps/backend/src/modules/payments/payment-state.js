import { ValidationError } from "../../shared/exceptions/AppError.js";

export const PAYMENT_STATUSES = Object.freeze({
  created: "created",
  pending: "pending",
  ledgerPending: "ledger_pending",
  succeeded: "succeeded",
  failed: "failed",
});

const LEGAL_TRANSITIONS = Object.freeze({
  created: new Set(["pending"]),
  pending: new Set(["ledger_pending", "failed"]),
  ledger_pending: new Set(["succeeded", "failed"]),
  succeeded: new Set(),
  failed: new Set(["pending"]),
});

export function canTransitionPaymentStatus(from, to) {
  return from === to || Boolean(LEGAL_TRANSITIONS[from]?.has(to));
}

export function transitionPaymentStatus(payment, nextStatus) {
  const current = payment.status;
  if (current === nextStatus) return payment;
  if (!canTransitionPaymentStatus(current, nextStatus)) {
    throw new ValidationError(`Illegal payment status transition: ${current} -> ${nextStatus}`);
  }
  payment.status = nextStatus;
  return payment;
}
