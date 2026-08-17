import { Router } from "express";
import { getMyWallet, connectOnboarding, getMyTransactions, postWithdrawal } from "./wallets.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { requestWithdrawalSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.get("/me", requireAuth, getMyWallet);
router.get("/me/transactions", requireAuth, requireRole("student"), getMyTransactions);
router.post("/me/connect", requireAuth, requireRole("student"), connectOnboarding);
router.post("/me/withdrawals", requireAuth, requireRole("student"), validateBody(requestWithdrawalSchema), postWithdrawal);

export default router;