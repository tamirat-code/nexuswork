import { apiRequest } from "../../lib/http.js";

export const listAuditLogs = (query = "", token) => apiRequest(`/audit-logs${query}`, { token });
export const getAuditSummary = (query = "", token) => apiRequest(`/audit-logs/summary${query}`, { token });
export const getEntityHistory = (entityType, entityId, token) =>
  apiRequest(`/audit-logs/history/${entityType}/${entityId}`, { token });
export const flagAuditLog = (id, reason, token) =>
  apiRequest(`/audit-logs/${id}/flag`, { method: "PATCH", body: { reason }, token });