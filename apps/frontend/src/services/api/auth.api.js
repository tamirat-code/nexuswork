import { apiRequest } from "../../lib/http.js";

export const register = (payload) => apiRequest("/auth/register", { method: "POST", body: payload });
export const login = (email, password) => apiRequest("/auth/login", { method: "POST", body: { email, password } });
export const googleAuth = (credential, options = {}) =>
  apiRequest("/auth/google", { method: "POST", body: { credential, ...options } });
export const getMe = (token) => apiRequest("/auth/me", { token });
export const logout = (token) => apiRequest("/auth/logout", { method: "POST", token });
export const changePassword = (currentPassword, newPassword, token) =>
  apiRequest("/auth/password", { method: "PATCH", body: { currentPassword, newPassword }, token });
export const forgotPassword = (email) => apiRequest("/auth/password/forgot", { method: "POST", body: { email } });
export const resetPassword = (resetToken, newPassword) =>
  apiRequest("/auth/password/reset", { method: "POST", body: { token: resetToken, newPassword } });
export const verifyEmail = (verifyToken) =>
  apiRequest("/auth/verify-email", { method: "POST", body: { token: verifyToken } });
export const resendVerification = (token) => apiRequest("/auth/resend-verification", { method: "POST", token });