import { apiRequest } from "../../lib/http.js";

export const getRecommendations = (token) => apiRequest("/recommendations/me", { token });
export const getCareerRecommendation = (token) => apiRequest("/recommendations/career", { token });