import { Router } from "express";
import {
  create,
  getForUser,
  getReputation,
  exportReputationCredential,
  verifyReputationCredential,
} from "./reviews.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { createReviewSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post("/reputation/verify", verifyReputationCredential);
router.post("/contract/:contractId", requireAuth, validateBody(createReviewSchema), create);
router.get("/user/:userId", getForUser);
router.get("/user/:userId/reputation", getReputation);
router.get("/user/:userId/reputation/export", requireAuth, exportReputationCredential);

export default router;
