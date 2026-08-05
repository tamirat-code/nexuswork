import { apiRequest } from "../../lib/http.js";

// TODO: backend analytics module is still a placeholder — wire this up once it's implemented.
export const getDashboardAnalytics = (token) => apiRequest("/analytics", { token });
