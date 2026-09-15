import { partnerApiRequest } from "../../lib/http.js";

export const getPartnerProfile = (apiKey) => partnerApiRequest("/me", { apiKey });
export const listPartnerKeys = (apiKey) => partnerApiRequest("/me/keys", { apiKey });
export const createPartnerKey = (payload, apiKey) => partnerApiRequest("/me/keys", { method: "POST", body: payload, apiKey });
export const revokePartnerKey = (keyId, apiKey) => partnerApiRequest(`/me/keys/${keyId}/revoke`, { method: "POST", apiKey });
export const getPartnerUsage = (apiKey) => partnerApiRequest("/me/usage", { apiKey });
export const getPartnerBilling = (apiKey) => partnerApiRequest("/me/billing", { apiKey });
export const listPartnerWebhooks = (apiKey) => partnerApiRequest("/me/webhooks", { apiKey });
export const createPartnerWebhook = (payload, apiKey) => partnerApiRequest("/me/webhooks", { method: "POST", body: payload, apiKey });
export const updatePartnerWebhook = (id, payload, apiKey) => partnerApiRequest(`/me/webhooks/${id}`, { method: "PATCH", body: payload, apiKey });
export const rotatePartnerWebhookSecret = (id, apiKey) => partnerApiRequest(`/me/webhooks/${id}/rotate-secret`, { method: "POST", apiKey });
export const disablePartnerWebhook = (id, apiKey) => partnerApiRequest(`/me/webhooks/${id}`, { method: "DELETE", apiKey });
export const listPartnerWebhookDeliveries = (apiKey) => partnerApiRequest("/me/webhook-deliveries", { apiKey });
