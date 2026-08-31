import { apiRequest } from "../../lib/http.js";

export const listProjects = (query = "") => apiRequest(`/projects${query}`);
export const getProject = (id) => apiRequest(`/projects/${id}`);
export const createProject = (payload, token) => apiRequest("/projects", { method: "POST", body: payload, token });
export const updateProject = (id, payload, token) => apiRequest(`/projects/${id}`, { method: "PATCH", body: payload, token });
