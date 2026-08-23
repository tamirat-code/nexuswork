import { apiRequest } from "../../lib/http.js";

export const listCategories = (query = "") => apiRequest(`/categories${query}`);
export const getCategory = (id) => apiRequest(`/categories/${id}`);
export const createCategory = (payload, token) => apiRequest("/categories", { method: "POST", body: payload, token });
export const updateCategory = (id, payload, token) =>
  apiRequest(`/categories/${id}`, { method: "PUT", body: payload, token });
export const deleteCategory = (id, token) =>
  apiRequest(`/categories/${id}`, { method: "DELETE", token });