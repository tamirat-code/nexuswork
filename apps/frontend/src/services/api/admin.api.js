import { apiRequest } from "../../lib/http.js";

export const listAdminStats = (token) => apiRequest("/admin/dashboard", { token });
export const listAdminUsers = (query = "", token) => apiRequest(`/admin/users${query}`, { token });
export const listAdminDisputes = (query = "", token) => apiRequest(`/admin/disputes${query}`, { token });
export const resolveAdminDispute = (disputeId, { resolution, outcome }, token) =>
  apiRequest(`/admin/disputes/${disputeId}/resolve`, {
    method: "PATCH",
    body: { resolution, outcome },
    token,
  });

export const listAdminReports = (query = "", token) => apiRequest(`/admin/reports${query}`, { token });
export const reviewAdminReport = (reportId, payload, token) => apiRequest(`/admin/reports/${reportId}/review`, { method: "PATCH", body: payload, token });
export const suspendAdminUser = (userId, reason, token) => apiRequest(`/admin/users/${userId}/suspend`, { method: "PATCH", body: { reason }, token });
export const restoreAdminUser = (userId, reason, token) => apiRequest(`/admin/users/${userId}/restore`, { method: "PATCH", body: { reason }, token });
export const changeAdminUserRole = (userId, payload, token) => apiRequest(`/admin/users/${userId}/role`, { method: "PATCH", body: payload, token });
export const deleteAdminUser = (userId, reason, token) => apiRequest(`/admin/users/${userId}`, { method: "DELETE", body: { reason }, token });
