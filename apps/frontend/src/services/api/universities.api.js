import { apiRequest } from "../../lib/http.js";

export const listUniversities = (query = "") => apiRequest(`/universities${query}`);
export const createUniversity = (payload, token) =>
  apiRequest("/universities", { method: "POST", body: payload, token });
