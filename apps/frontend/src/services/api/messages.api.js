import { apiRequest } from "../../lib/http.js";

export const listMessages = (contractId, token) => apiRequest(`/messaging/contract/${contractId}`, { token });
export const sendMessage = (contractId, { body, attachments } = {}, token) =>
  apiRequest(`/messaging/contract/${contractId}`, { method: "POST", body: { body, attachments }, token });