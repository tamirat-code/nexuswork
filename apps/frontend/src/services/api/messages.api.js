import { apiRequest } from "../../lib/http.js";

export const listMessages = (contractId, token) => apiRequest(`/messages/contract/${contractId}`, { token });
export const sendMessage = (contractId, body, token) =>
  apiRequest(`/messages/contract/${contractId}`, { method: "POST", body: { body }, token });
