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
    avatarUrl: user.avatarUrl,
    universityVerified: user.universityVerified,
  };
}

export const register = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password", "name", "role", "termsAccepted", "recaptchaToken"]);
  const { token, user } = await authService.registerUser(req.body);
  res.status(201).json({ success: true, data: { token, user: toPublicUser(user) } });
});

export const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password"]);
  const result = await authService.loginUser(req.body);
  if (result.mfaRequired) {
    return res.json({ success: true, data: { mfaRequired: true, challengeToken: result.challengeToken } });
  }
  if (result.mfaSetupRequired) {
    return res.json({
      success: true,
      data: {
        mfaSetupRequired: true,
        setupToken: result.setupToken,
        secret: result.secret,
        otpauthUri: result.otpauthUri,
      },
    });
  }
  res.json({ success: true, data: { token: result.token, user: toPublicUser(result.user) } });
});

export const setupMfa = asyncHandler(async (req, res) => {
  requireFields(req.body, ["token", "code"]);
  const { token, user, recoveryCodes } = await authService.setupMfa(req.body.token, req.body.code);
  res.json({ success: true, data: { token, user: toPublicUser(user), recoveryCodes } });
});

export const verifyMfa = asyncHandler(async (req, res) => {
  requireFields(req.body, ["token", "code"]);
  const { token, user } = await authService.verifyMfa(req.body.token, req.body.code);
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
    const result = await authService.loginOrRegisterWithGoogle(req.body.credential, {
      role: req.body.role,
      phone: req.body.phone,
      termsAccepted: req.body.termsAccepted,
      organizationName: req.body.organizationName,
      organizationType: req.body.organizationType,
      university_id: req.body.university_id,
      student_id_number: req.body.student_id_number,
      program: req.body.program,
      enrollment_status: req.body.enrollment_status,
    });
    const data = {
      isNewUser: result.isNewUser,
      ...(result.mfaRequired ? { mfaRequired: true, challengeToken: result.challengeToken } : {}),
      ...(result.mfaSetupRequired
        ? { mfaSetupRequired: true, setupToken: result.setupToken, secret: result.secret, otpauthUri: result.otpauthUri }
        : {}),
      ...(result.token ? { token: result.token, user: toPublicUser(result.user) } : {}),
    };
    res.status(result.isNewUser ? 201 : 200).json({ success: true, data });
  } catch (err) {
    if (err.needsRole) {
      return res.status(422).json({ success: false, message: err.message, needsRole: true });
    }
    throw err;
  }
});