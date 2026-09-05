import crypto from "node:crypto";
import { paymentConfig } from "../../../config/payment.config.js";
import { money, majorUnitsFromMoney, moneyFromLegacyMajorUnits } from "../../../shared/money/money.js";
import { PaymentProviderError, unsupportedCapability } from "./payment-provider.js";

const CHAPA_CURRENCY = "etb";
const CHAPA_REFERENCE_MAX_LENGTH = 36;

function chapaReference(value) {
  const reference = String(value || "");
  if (reference.length <= CHAPA_REFERENCE_MAX_LENGTH) return reference;
  // Keep a deterministic provider reference so retries resolve the same
  // Chapa transaction while respecting Chapa's 36-character limit.
  return `nw-${crypto.createHash("sha256").update(reference).digest("hex").slice(0, 32)}`;
}

function readableProviderMessage(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    if (typeof value.message === "string" && value.message.trim()) return value.message.trim();
    try { return JSON.stringify(value); } catch { return "Chapa rejected the request"; }
  }
  return "Chapa rejected the request";
}

function normalizeError(error, response) {
  const message = error?.name === "AbortError"
    ? "Chapa request timed out"
    : readableProviderMessage(error?.message) || "Chapa request failed (" + (response?.status || "unknown") + ")";
  return new PaymentProviderError(message, {
    code: error?.name === "AbortError" ? "timeout" : response?.status >= 500 ? "provider_unavailable" : "provider_error",
    retryable: error?.name === "AbortError" || response?.status >= 500,
    cause: error,
  });
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), paymentConfig.chapaRequestTimeoutMs);
  try {
    const response = await fetch(paymentConfig.chapaApiBaseUrl.replace(/\/$/, "") + path, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: "Bearer " + paymentConfig.chapaSecretKey,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.status === "failed") {
      throw normalizeError(new Error(readableProviderMessage(body?.message)), response);
    }
    return body;
  } catch (error) {
    if (error instanceof PaymentProviderError) throw error;
    throw normalizeError(error);
  } finally {
    clearTimeout(timer);
  }
}

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();
  if (["success", "succeeded", "paid"].includes(value)) return "succeeded";
  if (["failed", "cancelled", "canceled", "reversed", "refunded"].includes(value)) return "failed";
  return "pending";
}

function assertEtb(value) {
  const normalized = money(value.amountMinor, value.currency);
  if (normalized.currency !== CHAPA_CURRENCY) {
    throw new PaymentProviderError("Chapa payments must use ETB", { code: "currency_mismatch" });
  }
  return normalized;
}

function responseObject(body, operation) {
  const data = body?.data || body;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new PaymentProviderError("Chapa returned a malformed " + operation + " response", { code: "malformed_response" });
  }
  return data;
}

function providerAmountMinor(amount, currency) {
  if (amount === null || amount === undefined || typeof amount === "boolean") {
    throw new PaymentProviderError("Chapa returned an invalid amount", { code: "malformed_response" });
  }
  const text = String(amount).trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(text)) {
    throw new PaymentProviderError("Chapa returned an invalid amount", { code: "malformed_response" });
  }
  try {
    return moneyFromLegacyMajorUnits(text, currency, "Chapa amount").amountMinor;
  } catch (error) {
    throw new PaymentProviderError("Chapa returned an invalid amount", { code: "malformed_response", cause: error });
  }
}

function transferStatus(status) {
  return normalizeStatus(status);
}

function refundStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "refunded" || value === "success" || value === "succeeded") return "succeeded";
  if (value === "reversed" || value === "failed" || value === "cancelled" || value === "canceled") return "failed";
  return "pending";
}

export const chapaProvider = {
  name: "chapa",
  capabilities: ["hosted_checkout", "status_lookup", "refunds", "payouts", "webhooks"],
  async createPaymentIntent({ amountMinor, currency, metadata = {}, idempotencyKey }) {
    const value = assertEtb({ amountMinor, currency });
    const txRef = chapaReference(idempotencyKey || "nexuswork-" + crypto.randomUUID());
    const returnSeparator = paymentConfig.chapaReturnUrl.includes("?") ? "&" : "?";
    const body = await request("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        amount: String(majorUnitsFromMoney(value)),
        currency: "ETB",
        tx_ref: txRef,
        callback_url: paymentConfig.chapaCallbackUrl,
        return_url: `${paymentConfig.chapaReturnUrl}${returnSeparator}tx_ref=${encodeURIComponent(txRef)}`,
        meta: metadata,
      }),
    });
    const data = responseObject(body, "initialize");
    if (typeof data.checkout_url !== "string" || !data.checkout_url.trim()) {
      throw new PaymentProviderError("Chapa returned an incomplete initialize response", { code: "malformed_response" });
    }
    return {
      // Chapa verification is keyed by the tx_ref sent to initialize. The
      // provider may return a different display/reference identifier.
      id: txRef,
      providerReference: data?.ref_id || data?.reference,
      clientSecret: data?.checkout_url,
      status: normalizeStatus(data?.status),
      providerStatus: data?.status,
      metadata,
    };
  },
  async getPaymentIntent(id) {
    const body = await request("/transaction/verify/" + encodeURIComponent(id));
    const data = responseObject(body, "verification");
    if (typeof data.tx_ref !== "string" || !data.tx_ref.trim() || typeof data.status !== "string" || typeof data.currency !== "string") {
      throw new PaymentProviderError("Chapa returned an incomplete verification response", { code: "malformed_response" });
    }
    const normalizedCurrency = String(data.currency).toLowerCase();
    if (normalizedCurrency !== CHAPA_CURRENCY) {
      throw new PaymentProviderError("Chapa returned a non-ETB transaction", { code: "currency_mismatch" });
    }
    const amountMinor = providerAmountMinor(data.amount, normalizedCurrency);
    return {
      id: data?.tx_ref || id,
      providerReference: data?.reference,
      amountMinor,
      currency: normalizedCurrency,
      clientSecret: data.checkout_url,
      status: normalizeStatus(data?.status),
      providerStatus: data?.status,
      metadata: data?.meta || {},
    };
  },
  verifyWebhook(payload, signature) {
    const raw = Buffer.isBuffer(payload) ? payload : Buffer.from(JSON.stringify(payload || {}));
    const expected = crypto.createHmac("sha256", paymentConfig.chapaWebhookSecret || "").update(raw).digest("hex");
    const supplied = [signature, payload?.signature, payload?.["x-chapa-signature"]].filter(Boolean);
    const valid = supplied.some((value) => {
      const candidate = String(value);
      return candidate.length === expected.length && crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
    });
    if (!valid) throw new PaymentProviderError("Chapa webhook signature verification failed", { code: "invalid_signature" });
    return payload;
  },
  async createTransfer({ amountMinor, currency, destination, metadata = {}, idempotencyKey }) {
    const value = assertEtb({ amountMinor, currency });
    if (!destination?.accountNumber || !destination?.bankCode || !destination?.accountName) {
      throw new PaymentProviderError("Chapa payout bank details are incomplete", { code: "invalid_destination" });
    }
    const body = await request("/transfers", {
      method: "POST",
      body: JSON.stringify({
        account_name: destination.accountName,
        account_number: destination.accountNumber,
        amount: String(majorUnitsFromMoney(value)),
        currency: "ETB",
        bank_code: destination.bankCode,
        reference: chapaReference(idempotencyKey),
        meta: metadata,
      }),
    });
    const data = responseObject(body, "transfer");
    const id = data.reference || data.tx_ref || data.transfer_id || chapaReference(idempotencyKey);
    return {
      id,
      status: transferStatus(data.status || body.status),
      providerStatus: data.status || body.status,
      providerReference: data.reference || data.tx_ref,
    };
  },
  async getTransfer(id) {
    const body = await request("/transfers/verify/" + encodeURIComponent(id));
    const data = responseObject(body, "transfer verification");
    return {
      id: data.reference || data.tx_ref || id,
      status: transferStatus(data.status || body.status),
      providerStatus: data.status || body.status,
    };
  },
  async createRefund({ paymentIntentId, amountMinor, currency, metadata = {}, idempotencyKey }) {
    const value = assertEtb({ amountMinor, currency });
    if (!paymentIntentId) throw new PaymentProviderError("Chapa refund requires the original transaction reference", { code: "invalid_reference" });
    const params = new URLSearchParams({
      amount: String(majorUnitsFromMoney(value)),
      reason: String(metadata.reason || "NexusWork dispute resolution"),
      reference: chapaReference(idempotencyKey || "nexuswork-refund-" + crypto.randomUUID()),
    });
    const body = await request("/refund/" + encodeURIComponent(paymentIntentId), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = responseObject(body, "refund");
    const id = data.ref_id || data.reference || body.ref_id;
    if (typeof id !== "string" || !id.trim()) {
      throw new PaymentProviderError("Chapa returned an incomplete refund response", { code: "malformed_response" });
    }
    return { id, status: refundStatus(data.status || body.status), providerStatus: data.status || body.status };
  },
  async getRefund(id) {
    const body = await request("/refund/" + encodeURIComponent(id) + "/verify");
    const data = responseObject(body, "refund verification");
    if (typeof data.ref_id !== "string" || !data.ref_id.trim() || typeof data.status !== "string") {
      throw new PaymentProviderError("Chapa returned an incomplete refund verification response", { code: "malformed_response" });
    }
    return { id: data.ref_id, status: refundStatus(data.status || body.status), providerStatus: data.status };
  },
  createConnectedAccount() { return unsupportedCapability("Chapa", "connected accounts"); },
  getConnectedAccount() { return unsupportedCapability("Chapa", "connected accounts"); },
  createAccountLink() { return unsupportedCapability("Chapa", "account links"); },
  createLoginLink() { return unsupportedCapability("Chapa", "login links"); },
  getConnectedBalance() { return unsupportedCapability("Chapa", "connected balances"); },
  createPayout() { return unsupportedCapability("Chapa", "payouts"); },
};
