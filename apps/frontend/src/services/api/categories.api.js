import { apiRequest } from "../../lib/http.js";

export const listCategories = (query = "") => apiRequest(`/categories${query}`);
export const createCategory = (payload, token) => apiRequest("/categories", { method: "POST", body: payload, token });
