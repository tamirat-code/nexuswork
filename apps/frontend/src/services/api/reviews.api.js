import { apiRequest } from "../../lib/http.js";

export const submitReview = (contractId, payload, token) =>
  apiRequest(`/reviews/contract/${contractId}`, { method: "POST", body: payload, token });
export const getUserReviews = (userId) => apiRequest(`/reviews/user/${userId}`);
export const getUserReputation = (userId) => apiRequest(`/reviews/user/${userId}/reputation`);
export const exportMyReputation = (userId, token) =>
  apiRequest(`/reviews/user/${userId}/reputation/export`, { token });
export const verifyReputation = (document) =>
  apiRequest("/reviews/reputation/verify", { method: "POST", body: { document } });
