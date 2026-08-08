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

const router = Router();

router.post("/register", register);
router.post("/login", loginRateLimiter, login);
router.post("/google", loginRateLimiter, googleAuth);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);
router.patch("/password", requireAuth, changePassword);
router.post("/password/forgot", forgotPassword);
router.post("/password/reset", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", requireAuth, resendVerification);

export default router;