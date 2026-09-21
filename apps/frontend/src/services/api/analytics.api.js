import { apiRequest } from "../../lib/http.js";

export const getMyAnalytics = (token) => apiRequest("/analytics/me", { token });
export const getPlatformAnalytics = (token) => apiRequest("/analytics/platform", { token });
export const getUniversityAnalytics = (universityId, token) =>
  apiRequest(`/analytics/university/${universityId}`, { token });
export const getMyUniversityAnalytics = (token) => apiRequest("/analytics/university/mine", { token });
export const getDeliveryAnalytics = (params = {}, token) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
  return apiRequest(`/analytics/delivery${query.toString() ? `?${query}` : ""}`, { token });
};
