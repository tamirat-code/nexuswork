import { apiRequest } from "../../lib/http.js";

export const getVerifications = (query = "", token) => apiRequest(`/verifications${query}`, { token });
export const reviewVerification = (id, payload, token) =>
  apiRequest(`/verifications/${id}/review`, { method: "PATCH", body: payload, token });
export const requestVerification = (payload, token) =>
  apiRequest("/verifications", { method: "POST", body: payload, token });
