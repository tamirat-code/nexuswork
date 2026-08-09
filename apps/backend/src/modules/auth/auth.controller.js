import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import * as authService from "./auth.service.js";

function toPublicUser(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    email_verified: user.email_verified,
    auth_provider: user.auth_provider,
  };
}

export const register = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password", "name", "role", "termsAccepted", "recaptchaToken"]);
  const { token, user } = await authService.registerUser(req.body);
  res.status(201).json({ success: true, data: { token, user: toPublicUser(user) } });
});

export const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password"]);
  const { token, user } = await authService.loginUser(req.body);
  res.json({ success: true, data: { token, user: toPublicUser(user) } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: toPublicUser(req.user) });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.tokenPayload);
  res.json({ success: true, data: { loggedOut: true } });
});

export const changePassword = asyncHandler(async (req, res) => {
  requireFields(req.body, ["currentPassword", "newPassword"]);
  await authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
  res.json({ success: true, data: { changed: true } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email"]);
  await authService.requestPasswordReset(req.body.email);
  res.json({ success: true, data: { message: "If that email is registered, a reset link has been sent." } });
});

export const resetPassword = asyncHandler(async (req, res) => {
  requireFields(req.body, ["token", "newPassword"]);
  await authService.resetPassword(req.body.token, req.body.newPassword);
  res.json({ success: true, data: { reset: true } });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  requireFields(req.body, ["token"]);
  await authService.verifyEmail(req.body.token);
  res.json({ success: true, data: { verified: true } });
});

export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerificationEmail(req.user._id);
  res.json({ success: true, data: { sent: true } });
});

export const googleAuth = asyncHandler(async (req, res) => {
  requireFields(req.body, ["credential"]);
  try {
    const { token, user, isNewUser } = await authService.loginOrRegisterWithGoogle(req.body.credential, {
      role: req.body.role,
      termsAccepted: req.body.termsAccepted,
      organizationName: req.body.organizationName,
    });
    res.status(isNewUser ? 201 : 200).json({ success: true, data: { token, user: toPublicUser(user), isNewUser } });
  } catch (err) {
    if (err.needsRole) {
      return res.status(422).json({ success: false, message: err.message, needsRole: true });
    }
    throw err;
  }
});