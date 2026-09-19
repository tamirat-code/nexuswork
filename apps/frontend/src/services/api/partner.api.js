import { apiRequest, partnerApiRequest } from "../../lib/http.js";

const browserBase = "/api-partners/portal";
const browserRequest = (path = "", options = {}) => apiRequest(`${browserBase}${path}`, options);

export const getBrowserPartnerProfile = (token) => browserRequest("/", { token });
export const listBrowserPartnerKeys = (token) => browserRequest("/keys", { token });
export const createBrowserPartnerKey = (payload, token) => browserRequest("/keys", { method: "POST", body: payload, token });
export const revokeBrowserPartnerKey = (keyId, token) => browserRequest(`/keys/${keyId}/revoke`, { method: "POST", token });
export const getBrowserPartnerBilling = (token) => browserRequest("/billing", { token });
export const listBrowserPartnerWebhooks = (token) => browserRequest("/webhooks", { token });
export const createBrowserPartnerWebhook = (payload, token) => browserRequest("/webhooks", { method: "POST", body: payload, token });
export const updateBrowserPartnerWebhook = (id, payload, token) => browserRequest(`/webhooks/${id}`, { method: "PATCH", body: payload, token });
export const rotateBrowserPartnerWebhookSecret = (id, token) => browserRequest(`/webhooks/${id}/rotate-secret`, { method: "POST", token });
export const disableBrowserPartnerWebhook = (id, token) => browserRequest(`/webhooks/${id}`, { method: "DELETE", token });
export const listBrowserPartnerWebhookDeliveries = (token) => browserRequest("/webhook-deliveries", { token });

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
