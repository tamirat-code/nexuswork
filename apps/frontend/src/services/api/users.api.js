import { apiRequest } from "../../lib/http.js";

export const getUser = (id, token) => apiRequest(`/users/${id}`, { token });
export const updateMe = (payload, token) =>
  apiRequest("/users/me", { method: "PATCH", body: payload, token });

export const updateMyAvatar = (avatar, token) =>
  apiRequest("/users/me/avatar", { method: "PATCH", body: { avatar }, token });
export const removeMyAvatar = (token) =>
  apiRequest("/users/me/avatar", { method: "DELETE", token });
export const updateLanguage = (preferred_language, token) => apiRequest("/users/me/preferences", { method: "PATCH", body: { preferred_language }, token });
