import { apiRequest } from "../../lib/http.js";

export const openDispute = (milestoneId, payload, token) =>
  apiRequest(`/disputes/milestone/${milestoneId}`, { method: "POST", body: payload, token });
export const listDisputes = (token) => apiRequest("/disputes", { token });
export const getDispute = (id, token) => apiRequest(`/disputes/${id}`, { token });
