import { Router } from "express";
import { getMyWallet, connectOnboarding } from "./wallets.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

const router = Router();

router.get("/me", requireAuth, getMyWallet);
router.post("/me/connect", requireAuth, requireRole("student"), connectOnboarding);

export default router;