import { Router } from "express";
import {
  getMyWallet,
  getMyPayoutStatus,
  connectOnboarding,
  getMyTransactions,
  postWithdrawal,
  updateChapaPayout,
  getMyChapaBanks,
} from "./wallets.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { requireEmailVerified } from "../../middleware/verification.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { chapaPayoutDetailsSchema, requestWithdrawalSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.get("/me", requireAuth, getMyWallet);
router.get("/me/payout-status", requireAuth, requireRole("student"), getMyPayoutStatus);
router.get("/me/chapa-banks", requireAuth, requireRole("student"), getMyChapaBanks);
router.get("/me/transactions", requireAuth, requireRole("student"), getMyTransactions);
router.post("/me/connect", requireAuth, requireEmailVerified, requireRole("student"), connectOnboarding);
router.put(
  "/me/chapa-payout",
  requireAuth,
  requireEmailVerified,
  requireRole("student"),
  validateBody(chapaPayoutDetailsSchema),
  updateChapaPayout
);
router.post(
  "/me/withdrawals",
  requireAuth,
  requireEmailVerified,
  requireRole("student"),
  validateBody(requestWithdrawalSchema),
  postWithdrawal
);

export default router;
