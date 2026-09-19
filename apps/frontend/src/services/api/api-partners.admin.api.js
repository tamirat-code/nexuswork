import { apiRequest } from "../../lib/http.js";

const base = "/admin/api-partners";

export const listApiPartners = (token) => apiRequest(base, { token });
export const createApiPartner = (payload, token) => apiRequest(base, { method: "POST", body: payload, token });
export const listApiPartnerKeys = (partnerId, token) => apiRequest(`${base}/${partnerId}/keys`, { token });
export const createApiPartnerKey = (partnerId, payload, token) => apiRequest(`${base}/${partnerId}/keys`, { method: "POST", body: payload, token });
export const revokeApiPartnerKey = (partnerId, keyId, token) => apiRequest(`${base}/${partnerId}/keys/${keyId}/revoke`, { method: "POST", token });
export const updateApiPartnerStatus = (partnerId, payload, token) => apiRequest(`${base}/${partnerId}/status`, { method: "PATCH", body: payload, token });
export const listApiPartnerBilling = (partnerId, token) => apiRequest(`${base}/${partnerId}/billing`, { token });
export const updateApiPartnerBillingMode = (partnerId, billing_mode, token) => apiRequest(`${base}/${partnerId}/billing/mode`, { method: "PATCH", body: { billing_mode }, token });
export const createStripeBillingSetupIntent = (partnerId, token) => apiRequest(`${base}/${partnerId}/billing/stripe/setup-intent`, { method: "POST", token });
export const saveStripeBillingPaymentMethod = (partnerId, payment_method_id, token) => apiRequest(`${base}/${partnerId}/billing/stripe/payment-method`, { method: "POST", body: { payment_method_id }, token });
export const createApiWalletTopUp = (partnerId, amount_minor, token) => apiRequest(`${base}/${partnerId}/wallet/topup`, { method: "POST", body: { amount_minor }, token });
