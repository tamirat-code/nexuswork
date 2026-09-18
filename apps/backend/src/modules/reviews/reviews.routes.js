import { Router } from "express";
import {
  create,
  getForUser,
  getReputation,
  exportReputationCredential,
  verifyReputationCredential,
  updateReputationStatus,
} from "./reviews.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../../shared/validators/ZodValidator.js";
import { createReviewSchema, objectIdParamsSchema, updateReputationCredentialStatusSchema } from "../../shared/validators/schemas.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { ROLES } from "../../shared/enums/roles.enum.js";

const router = Router();

router.post("/reputation/verify", verifyReputationCredential);
router.patch("/user/:userId/reputation/status", requireAuth, requireRole(ROLES.ADMIN), validateParams(objectIdParamsSchema("userId")), validateBody(updateReputationCredentialStatusSchema), updateReputationStatus);
router.post("/contract/:contractId", requireAuth, validateBody(createReviewSchema), create);
router.get("/user/:userId", getForUser);
router.get("/user/:userId/reputation", getReputation);
router.get("/user/:userId/reputation/export", requireAuth, exportReputationCredential);

export default router;
