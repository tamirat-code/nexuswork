import { apiRequest } from "../../lib/http.js";

export const listSkills = (query = "") => apiRequest(`/skills${query}`);
export const createSkill = (payload, token) => apiRequest("/skills", { method: "POST", body: payload, token });
