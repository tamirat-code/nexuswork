import { apiRequest } from "../../lib/http.js";

export const searchAll = (query = "") => apiRequest(`/search${query}`);
