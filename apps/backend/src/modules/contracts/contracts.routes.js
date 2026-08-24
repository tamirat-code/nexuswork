import { Router } from "express";
import { getMyContracts, getOne, review, sign } from "./contracts.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireEmailVerified } from "../../middleware/verification.middleware.js";

const router = Router();

router.get("/", requireAuth, getMyContracts);
router.get("/:id", requireAuth, getOne);
router.post("/:id/review", requireAuth, review);
router.post("/:id/sign", requireAuth, requireEmailVerified, sign);

export default router;