import { apiRequest } from "../../lib/http.js";

export const submitProposal = (payload, token) => apiRequest("/proposals", { method: "POST", body: payload, token });
export const listProjectProposals = (projectId, token) => apiRequest(`/proposals/project/${projectId}`, { token });
export const acceptProposal = (id, token) => apiRequest(`/proposals/${id}/accept`, { method: "POST", token });
