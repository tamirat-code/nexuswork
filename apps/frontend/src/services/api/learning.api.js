import { apiRequest } from "../../lib/http.js";

export const getLearningRecommendations = (token) => apiRequest("/learning/recommendations", { token });
