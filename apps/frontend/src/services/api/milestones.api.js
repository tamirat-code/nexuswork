import { apiRequest } from "../../lib/http.js";

export const createMilestone = (contractId, payload, token) =>
  apiRequest(`/milestones/contract/${contractId}`, { method: "POST", body: payload, token });
export const fundMilestone = (id, token) => apiRequest(`/milestones/${id}/fund`, { method: "POST", token });
export const confirmMilestoneFunding = (id, paymentIntentId, token) =>
  apiRequest(`/milestones/${id}/fund/confirm`, {
    method: "POST",
    body: { payment_intent_id: paymentIntentId },
    token,
  });
export const startMilestoneWork = (id, token) =>
  apiRequest(`/milestones/${id}/start`, { method: "POST", token });

export const submitMilestoneWork = (id, payload, token) =>
  apiRequest(`/milestones/${id}/submit`, { method: "POST", body: payload, token });

export const requestMilestoneRevision = (id, reason, token) =>
  apiRequest(`/milestones/${id}/request-revision`, {
    method: "POST",
    body: { reason },
    token,
  });
export const approveMilestone = (id, token) => apiRequest(`/milestones/${id}/approve`, { method: "POST", token });
export const getMilestone = (id, token) => apiRequest(`/milestones/${id}`, { token });


  export const listContractMilestones = (contractId, token) =>
  apiRequest(`/milestones/contract/${contractId}`, { token });