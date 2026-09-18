import { apiRequest } from "../../lib/http.js";

export const getMyPortfolio = (token) => apiRequest("/portfolios/mine", { token });
export const listPortfolios = (query = "") => apiRequest(`/portfolios${query}`);
export const getUserPortfolio = (userId) => apiRequest(`/portfolios/user/${userId}`);
export const getPortfolioItem = (id) => apiRequest(`/portfolios/${id}`);
export const getMilestonePortfolioConsent = (milestoneId, token) =>
  apiRequest(`/portfolios/milestone/${milestoneId}/consent`, { token });
export const respondToMilestonePortfolioConsent = (id, decision, token) =>
  apiRequest(`/portfolios/${id}/consent`, { method: "PATCH", body: { decision }, token });
export const createPortfolioEntry = (payload, token) =>
  apiRequest("/portfolios", {
    method: "POST",
    body: {
      ...payload,
      project_url: payload.project_url?.trim() || payload.url?.trim() || null,
      video_url: payload.video_url?.trim() || null,
      image_url: payload.image_url?.trim() || null,
    },
    token,
  });
export const deletePortfolioEntry = (id, token) =>
  apiRequest(`/portfolios/${id}`, { method: "DELETE", token });
