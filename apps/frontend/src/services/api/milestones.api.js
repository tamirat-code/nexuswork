import { apiRequest } from "../../lib/http.js";


export const createMilestone = (contractId, payload, token) =>
  apiRequest(`/milestones/contract/${contractId}`, {
    method: "POST",
    body: payload,
    token,
  });

export const listMilestones = (contractId, token) =>
  apiRequest(`/milestones/contract/${contractId}`, {
    token,
  });

export const listContractMilestones = listMilestones;

export const getMilestone = (milestoneId, token) =>
  apiRequest(`/milestones/${milestoneId}`, {
    token,
  });

export const fundMilestone = (milestoneId, token, provider) =>
  apiRequest(`/milestones/${milestoneId}/fund`, {
    method: "POST",
    body: provider ? { provider } : undefined,
    token,
  });

export const confirmMilestoneFunding = (paymentIntentId, token) =>
  apiRequest("/milestones/fund/confirm", {
    method: "POST",
    body: { payment_intent_id: paymentIntentId },
    token,
  });


export const startMilestoneWork = (milestoneId, token) =>
  apiRequest(`/milestones/${milestoneId}/start`, {
    method: "POST",
    token,
  });

export const submitMilestoneWork = (milestoneId, payload = {}, token) =>
  apiRequest(`/milestones/${milestoneId}/submit`, {
    method: "POST",
    body: payload,
    token,
  });


export const requestMilestoneRevision = (submissionId, payload = {}, token) =>
  apiRequest(`/submissions/${submissionId}/request-revision`, {
    method: "POST",
    body: payload,
    token,
  });

export const approveMilestone = (milestoneId, token) =>
  apiRequest(`/milestones/${milestoneId}/approve`, {
    method: "POST",
    token,
  });

export const retryMilestoneRelease = (milestoneId, token) =>
  apiRequest(`/milestones/${milestoneId}/release`, {
    method: "POST",
    token,
  });

export const releaseMilestone = retryMilestoneRelease;

export const openMilestoneDispute = (milestoneId, payload, token) =>
  apiRequest(`/milestones/${milestoneId}/dispute`, {
    method: "POST",
    body: payload,
    token,
  });
