import { apiRequest } from "../../lib/http.js";

export const getMyAnalytics = (token) => apiRequest("/analytics/me", { token });
export const getPlatformAnalytics = (token) => apiRequest("/analytics/platform", { token });
export const getUniversityAnalytics = (universityId, token) =>
  apiRequest(`/analytics/university/${universityId}`, { token });