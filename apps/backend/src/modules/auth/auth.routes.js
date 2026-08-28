import { Router } from "express";
import {
  register,
  login,
  me,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  googleAuth,
  initiateMfaSetup,
  setupMfa,
  verifyMfa,
} from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { loginRateLimiter, verificationRateLimiter } from "../../middleware/rateLimiter.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  mfaCodeSchema,
} from "../../shared/validators/schemas.js";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", loginRateLimiter, validateBody(loginSchema), login);
router.post("/google", loginRateLimiter, validateBody(googleAuthSchema), googleAuth);
router.post("/mfa/setup/initiate", requireAuth, initiateMfaSetup);
router.post("/mfa/setup", loginRateLimiter, validateBody(mfaCodeSchema), setupMfa);
router.post("/mfa/verify", loginRateLimiter, validateBody(mfaCodeSchema), verifyMfa);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);
router.patch("/password", requireAuth, validateBody(changePasswordSchema), changePassword);
router.post("/password/forgot", validateBody(forgotPasswordSchema), forgotPassword);
router.post("/password/reset", validateBody(resetPasswordSchema), resetPassword);
router.post("/verify-email", validateBody(verifyEmailSchema), verifyEmail);
router.post("/resend-verification", requireAuth, verificationRateLimiter, resendVerification);

export default router;
