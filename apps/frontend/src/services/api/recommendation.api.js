import { apiRequest } from "../../lib/http.js";


export const getRecommendations = (token) => apiRequest("/recommendations/me", { token });
export const getCareerRecommendation = (token) => apiRequest("/recommendations/career", { token });
export const getRecommendationHistory = (token) => apiRequest("/recommendations/history", { token });
export const submitRecommendationFeedback = (projectId, payload, token) =>
  apiRequest(`/recommendations/${projectId}/feedback`, { method: "POST", body: payload, token });


export const getStudentMatchesForProject = (projectId, token) =>
  apiRequest(`/recommendations/project/${projectId}/students`, { token });

export const getSuggestedPrice = ({ skills = [], category } = {}, token) => {
  const params = new URLSearchParams();
  skills.forEach((s) => params.append("skills", s));
  if (category) params.set("category", category);
  const qs = params.toString();
  return apiRequest(`/recommendations/price-suggestion${qs ? `?${qs}` : ""}`, { token });
};
