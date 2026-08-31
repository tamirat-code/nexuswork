export const PROVIDER_PAYMENT_STATUSES = Object.freeze({
  pending: "pending",
  succeeded: "succeeded",
  failed: "failed",
});

export const PROVIDER_CAPABILITIES = Object.freeze({
  hostedCheckout: "hosted_checkout",
  statusLookup: "status_lookup",
  refunds: "refunds",
  payouts: "payouts",
  webhooks: "webhooks",
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

export function unsupportedCapability(provider, capability) {
  throw new PaymentProviderError(`${provider} does not support ${capability}`, {
    code: "unsupported_capability",
    retryable: false,
  });
}


export function assertPaymentProvider(provider) {
  const required = [
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
  for (const method of required) {
    if (typeof provider?.[method] !== "function") {
      throw new TypeError(`Payment provider is missing capability: ${method}`);
    }
  }
  return provider;
}
