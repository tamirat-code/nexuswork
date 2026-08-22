import { apiRequest } from "../../lib/http.js";

export const getStaffVerifications = (query = "", token) =>
  apiRequest(`/staff-verifications${query}`, { token });
export const getMyStaffVerifications = (token) => apiRequest("/staff-verifications/mine", { token });
export const getStaffVerificationStats = (token) => apiRequest("/staff-verifications/stats", { token });
export const reviewStaffVerification = (id, payload, token) =>
  apiRequest(`/staff-verifications/${id}/review`, { method: "PATCH", body: payload, token });
export const requestStaffVerification = (payload, token) =>
  apiRequest("/staff-verifications", { method: "POST", body: payload, token });