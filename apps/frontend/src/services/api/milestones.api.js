import { apiRequest } from "../../lib/http.js";

export const createMilestone = (contractId, payload, token) =>
  apiRequest(`/milestones/contract/${contractId}`, {
    method: "POST",
    body: payload,
    token,
  });

export const listContractMilestones = (contractId, token) =>
  apiRequest(`/milestones/contract/${contractId}`, { token });

export const fundMilestone = (milestoneId, token) =>
  apiRequest(`/milestones/${milestoneId}/fund`, { method: "POST", token });

export const submitMilestoneWork = (milestoneId, payload, token) =>
  apiRequest(`/milestones/${milestoneId}/submit`, {
    method: "POST",
    body: payload,
    token,
  });

export const approveMilestone = (milestoneId, token) =>
  apiRequest(`/milestones/${milestoneId}/approve`, { method: "POST", token });

export const requestMilestoneRevision = (submissionId, reason, token) =>
  apiRequest(`/submissions/${submissionId}/request-revision`, {
    method: "POST",
    body: { reason },
    token,
  });