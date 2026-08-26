import { apiRequest } from "../../lib/http.js";

export const listSkills = (query = "") => apiRequest(`/skills${query}`);
export const createSkill = (payload, token) => apiRequest("/skills", { method: "POST", body: payload, token });
export const updateSkill = (id, payload, token) => apiRequest(`/skills/${id}`, { method: "PATCH", body: payload, token });
