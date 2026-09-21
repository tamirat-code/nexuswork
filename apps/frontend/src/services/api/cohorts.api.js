import { apiRequest } from "../../lib/http.js";

export const listCohorts = (query = "", token) => apiRequest(`/cohorts${query}`, { token });
export const getCohort = (id, token) => apiRequest(`/cohorts/${id}`, { token });
export const createCohort = (payload, token) => apiRequest("/cohorts", { method: "POST", body: payload, token });
export const applyToCohort = (id, token) => apiRequest(`/cohorts/${id}/applications`, { method: "POST", token });
export const listCohortApplications = (id, token) => apiRequest(`/cohorts/${id}/applications`, { token });
export const acceptCohortApplication = (cohortId, applicationId, token) => apiRequest(`/cohorts/${cohortId}/applications/${applicationId}/accept`, { method: "POST", token });
export const getCohortProgress = (id, token) => apiRequest(`/cohorts/${id}/progress`, { token });
