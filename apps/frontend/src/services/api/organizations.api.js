import { apiRequest } from "../../lib/http.js";

export const listMyOrganizations = (token) => apiRequest("/organizations/mine", { token });
export const listInstitutions = (token) => apiRequest("/organizations/institutions", { token });
export const listMyInstitutions = (token) => apiRequest("/organizations/institutions/mine", { token });
export const createOrganization = (payload, token) => apiRequest("/organizations", { method: "POST", body: payload, token });
export const updateOrganization = (id, payload, token) => apiRequest(`/organizations/${id}`, { method: "PATCH", body: payload, token });
export const getOrganization = (id, token) => apiRequest(`/organizations/${id}`, { token });
export const listOrganizationMembers = (id, token) => apiRequest(`/organizations/${id}/members`, { token });
export const inviteOrganizationMember = (id, payload, token) => apiRequest(`/organizations/${id}/members`, { method: "POST", body: payload, token });
export const updateOrganizationMember = (id, userId, payload, token) => apiRequest(`/organizations/${id}/members/${userId}`, { method: "PATCH", body: payload, token });
export const removeOrganizationMember = (id, userId, token) => apiRequest(`/organizations/${id}/members/${userId}`, { method: "DELETE", token });
export const requestInstitutionOnboarding = (payload, token) => apiRequest("/organizations/institution-onboarding", { method: "POST", body: payload, token });
export const listMyInstitutionRequests = (token) => apiRequest("/organizations/institution-onboarding/mine", { token });
export const listInstitutionOnboardingRequests = (status = "pending", token) => apiRequest(`/organizations/institution-onboarding?status=${encodeURIComponent(status)}`, { token });
export const decideInstitutionOnboarding = (id, payload, token) => apiRequest(`/organizations/institution-onboarding/${id}`, { method: "PATCH", body: payload, token });
