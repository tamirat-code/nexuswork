import { apiRequest } from "../../lib/http.js";

export const openDispute = (milestoneId, token) =>
  apiRequest(`/disputes/milestone/${milestoneId}`, { method: "POST", token });
