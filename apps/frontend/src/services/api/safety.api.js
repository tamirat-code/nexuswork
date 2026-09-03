import { apiRequest } from "../../lib/http.js";

export const blockUser = (userId, token) => apiRequest(`/safety/blocks/${userId}`, { method: "PUT", token });
export const unblockUser = (userId, token) => apiRequest(`/safety/blocks/${userId}`, { method: "DELETE", token });
export const reportUser = (userId, reason, token) => apiRequest(`/safety/reports/${userId}`, { method: "POST", body: { reason }, token });
