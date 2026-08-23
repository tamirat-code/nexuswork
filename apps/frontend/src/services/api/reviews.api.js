import { apiRequest } from "../../lib/http.js";

export const submitReview = (contractId, payload, token) =>
  apiRequest(`/reviews/contract/${contractId}`, { method: "POST", body: payload, token });
export const getUserReviews = (userId) => apiRequest(`/reviews/user/${userId}`);
export const getUserReputation = (userId) => apiRequest(`/reviews/user/${userId}/reputation`);