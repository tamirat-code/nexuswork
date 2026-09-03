import { apiRequest } from "../../lib/http.js";

export const getProposalDraft = (projectId, token) => apiRequest(`/proposal-drafts/${projectId}`, { token });
export const saveProposalDraft = (projectId, payload, token) => apiRequest(`/proposal-drafts/${projectId}`, { method: "PUT", body: payload, token });
export const deleteProposalDraft = (projectId, token) => apiRequest(`/proposal-drafts/${projectId}`, { method: "DELETE", token });
