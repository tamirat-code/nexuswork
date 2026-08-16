import { apiRequest } from "../../lib/http.js";

export const createMilestone = (contractId, payload, token) =>
  apiRequest(`/milestones/contract/${contractId}`, { method: "POST", body: payload, token });
export const fundMilestone = (id, token) => apiRequest(`/milestones/${id}/fund`, { method: "POST", token });
export const submitMilestoneWork = (id, payload, token) =>
  apiRequest(`/milestones/${id}/submit`, { method: "POST", body: payload, token });
export const approveMilestone = (id, token) => apiRequest(`/milestones/${id}/approve`, { method: "POST", token });
export const getMilestone = (id, token) => apiRequest(`/milestones/${id}`, { token });
