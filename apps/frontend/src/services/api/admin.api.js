import { apiRequest } from "../../lib/http.js";

export const listAdminStats = (token) => apiRequest("/admin/dashboard", { token });
export const listAdminUsers = (query = "", token) => apiRequest(`/admin/users${query}`, { token });
export const listAdminDisputes = (query = "", token) => apiRequest(`/admin/disputes${query}`, { token });