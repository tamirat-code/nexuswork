export const PROVIDER_PAYMENT_STATUSES = Object.freeze({
  pending: "pending",
  succeeded: "succeeded",
  failed: "failed",
});

export class PaymentProviderError extends Error {
  constructor(message, { code, providerStatus, retryable = false, cause } = {}) {
    super(message, { cause });
    this.name = "PaymentProviderError";
    this.code = code;
    this.providerStatus = providerStatus;
    this.retryable = retryable;
  }
}

/**
 * Provider-neutral capability contract. Implementations may expose provider
 * identifiers in their returned values, but domain services must only consume
 * these normalized operations.
 */
export function assertPaymentProvider(provider) {
  const required = [
    "createPaymentIntent",
    "getPaymentIntent",
    "createTransfer",
    "getTransfer",
    "createRefund",
    "createConnectedAccount",
    "getConnectedAccount",
    "createAccountLink",
    "createLoginLink",
    "getConnectedBalance",
    "createPayout",
    "verifyWebhook",
  ];
  for (const method of required) {
    if (typeof provider?.[method] !== "function") {
      throw new TypeError(`Payment provider is missing capability: ${method}`);
    }
  }
  return provider;
}
