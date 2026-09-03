import { apiRequest } from "../../lib/http.js";

export const listSavedProjects = (token) => apiRequest("/saved-projects", { token });
export const saveProject = (projectId, token) => apiRequest(`/saved-projects/${projectId}`, { method: "PUT", token });
export const removeSavedProject = (projectId, token) => apiRequest(`/saved-projects/${projectId}`, { method: "DELETE", token });
