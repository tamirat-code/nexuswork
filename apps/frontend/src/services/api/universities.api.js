import { apiRequest } from "../../lib/http.js";

export const listUniversities = (query = "") => apiRequest(`/universities${query}`);
export const getMyUniversity = (token) => apiRequest("/universities/mine", { token });
export const createUniversity = (payload, token) =>
  apiRequest("/universities", { method: "POST", body: payload, token });