import { apiRequest } from "../../lib/http.js";

export const listMessages = (contractId, token) => apiRequest(`/messaging/contract/${contractId}`, { token });
export const sendMessage = (contractId, { body, attachments } = {}, token) =>
  apiRequest(`/messaging/contract/${contractId}`, { method: "POST", body: { body, attachments }, token });

export const startPreContractConversation = (projectId, studentId, token) =>
  apiRequest(`/messaging/pre-contract/project/${projectId}/student/${studentId}`, { method: "POST", token });
export const getPreContractConversation = (conversationId, token) =>
  apiRequest(`/messaging/pre-contract/${conversationId}`, { token });
export const sendPreContractMessage = (conversationId, body, token) =>
  apiRequest(`/messaging/pre-contract/${conversationId}/messages`, { method: "POST", body: { body }, token });
