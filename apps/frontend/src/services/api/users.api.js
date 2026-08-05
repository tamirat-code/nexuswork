import { apiRequest } from "../../lib/http.js";

export const getUser = (id, token) => apiRequest(`/users/${id}`, { token });
