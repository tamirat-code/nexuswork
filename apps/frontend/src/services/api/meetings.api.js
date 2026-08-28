import { apiRequest } from "../../lib/http.js";
export const createMeeting = (payload, token) => apiRequest("/meetings", { method: "POST", body: payload, token });
export const getMeeting = (id, token) => apiRequest(`/meetings/${id}`, { token });
export const listContractMeetings = (id, token) => apiRequest(`/meetings/contract/${id}`, { token });
export const joinMeeting = (id, token) => apiRequest(`/meetings/${id}/join`, { method: "POST", token });
export const leaveMeeting = (id, token) => apiRequest(`/meetings/${id}/leave`, { method: "POST", token });
export const startMeeting = (id, token) => apiRequest(`/meetings/${id}/start`, { method: "POST", token });
export const endMeeting = (id, token) => apiRequest(`/meetings/${id}/end`, { method: "POST", token });
