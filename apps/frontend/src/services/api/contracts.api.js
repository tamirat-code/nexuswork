import { apiRequest } from "../../lib/http.js";

export const listMyContracts = (token) => apiRequest("/contracts", { token });
export const getContract = (id, token) => apiRequest(`/contracts/${id}`, { token });
export const reviewContract = (id, token) =>
  apiRequest(`/contracts/${id}/review`, { method: "POST", token });
export const signContract = (id, token) =>
  apiRequest(`/contracts/${id}/sign`, { method: "POST", body: { confirm_terms: true }, token });
export const listContractMilestones = (contractId, token) =>
  apiRequest(`/milestones/contract/${contractId}`, { token });
