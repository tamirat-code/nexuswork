import { apiRequest } from "../../lib/http.js";

export const getMyClientProfile = (token) => apiRequest("/clients/me", { token });
export const updateMyClientProfile = (payload, token) =>
  apiRequest("/clients/me", { method: "PATCH", body: payload, token });
export const listClients = (query = "") => apiRequest(`/clients${query}`);
