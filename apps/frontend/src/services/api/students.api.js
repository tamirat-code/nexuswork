import { apiRequest } from "../../lib/http.js";

export const getMyStudentProfile = (token) => apiRequest("/students/me", { token });
export const updateMyStudentProfile = (payload, token) =>
  apiRequest("/students/me", { method: "PATCH", body: payload, token });

export const listStudents = (query = "") => apiRequest(`/students${query}`);

export const getStudentProfile = (id) => apiRequest(`/students/${id}`);