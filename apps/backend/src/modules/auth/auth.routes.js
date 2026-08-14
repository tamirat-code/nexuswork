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
} from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { loginRateLimiter } from "../../middleware/rateLimiter.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../../shared/validators/schemas.js";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", loginRateLimiter, validateBody(loginSchema), login);
router.post("/google", loginRateLimiter, validateBody(googleAuthSchema), googleAuth);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);
router.patch("/password", requireAuth, validateBody(changePasswordSchema), changePassword);
router.post("/password/forgot", validateBody(forgotPasswordSchema), forgotPassword);
router.post("/password/reset", validateBody(resetPasswordSchema), resetPassword);
router.post("/verify-email", validateBody(verifyEmailSchema), verifyEmail);
router.post("/resend-verification", requireAuth, resendVerification);

export default router;