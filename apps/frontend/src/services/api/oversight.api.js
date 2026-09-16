import { apiRequest } from "../../lib/http.js";

export const getProjectOversight = (projectId, token) => apiRequest(`/oversight/projects/${projectId}`, { token });
export const createOversightTask = (projectId, payload, token) => apiRequest(`/oversight/projects/${projectId}/tasks`, { method: "POST", body: payload, token });
export const updateOversightTask = (taskId, payload, token) => apiRequest(`/oversight/tasks/${taskId}`, { method: "PATCH", body: payload, token });
export const createProjectCheckIn = (projectId, payload, token) => apiRequest(`/oversight/projects/${projectId}/check-ins`, { method: "POST", body: payload, token });
