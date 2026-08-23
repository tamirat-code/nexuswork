import { apiRequest } from "../../lib/http.js";

export const getMyPortfolio = (token) => apiRequest("/portfolios/mine", { token });
export const listPortfolios = (query = "") => apiRequest(`/portfolios${query}`);
export const getUserPortfolio = (userId) => apiRequest(`/portfolios/user/${userId}`);
export const createPortfolioEntry = (payload, token) =>
  apiRequest("/portfolios", { method: "POST", body: payload, token });
export const deletePortfolioEntry = (id, token) =>
  apiRequest(`/portfolios/${id}`, { method: "DELETE", token });