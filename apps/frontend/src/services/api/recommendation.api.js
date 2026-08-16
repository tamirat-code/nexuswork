import { apiRequest } from "../../lib/http.js";

export const getRecommendations = (token) => apiRequest("/recommendations", { token });
