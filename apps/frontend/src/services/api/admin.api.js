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
