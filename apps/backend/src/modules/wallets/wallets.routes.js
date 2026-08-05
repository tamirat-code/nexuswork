import { Router } from "express";
import { getMyWallet } from "./wallets.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/me", requireAuth, getMyWallet);

export default router;
