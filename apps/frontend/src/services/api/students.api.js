import { apiRequest } from "../../lib/http.js";

export const getMyStudentProfile = (token) => apiRequest("/students/me", { token });
export const updateMyStudentProfile = (payload, token) =>
  apiRequest("/students/me", { method: "PATCH", body: payload, token });

/**
 * Browse endpoint is not yet wired on the backend (backend module has
 * GET/PATCH /students/me only). Keep the collection call ready so swapping
 * in the real response later is a one-line change.
 */
export const listStudents = (query = "") => apiRequest(`/students${query}`);
