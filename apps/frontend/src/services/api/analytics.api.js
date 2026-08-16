import { apiRequest } from "../../lib/http.js";

export const getDashboardAnalytics = (token) => apiRequest("/analytics/me", { token });