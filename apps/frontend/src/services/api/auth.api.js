import { apiRequest } from "../../lib/http.js";

export const login = (email, password) => apiRequest("/auth/login", { method: "POST", body: { email, password } });
export const register = (payload) => apiRequest("/auth/register", { method: "POST", body: payload });
export const getMe = (token) => apiRequest("/auth/me", { token });
