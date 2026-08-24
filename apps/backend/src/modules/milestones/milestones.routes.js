import { Router } from "express";
import {
  create,
  listByContract,
  getOne,
  fund,
  confirmFunding,
  start,
  submit,
  approve,
  retryRelease,
} from "./milestones.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { requireEmailVerified } from "../../middleware/verification.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import {
  createMilestoneSchema,
  submitWorkSchema,
} from "../../shared/validators/schemas.js";

const router = Router();

router.post(
  "/contract/:contractId",
  requireAuth,
  requireEmailVerified,
  requireRole("client", "admin"),
  validateBody(createMilestoneSchema),
  create
);

router.get("/contract/:contractId", requireAuth, listByContract);

/*
 * Must be declared before generic /:id routes.
 * Used by FundMilestoneDialog after Stripe payment succeeds.
 */
router.post("/fund/confirm", requireAuth, requireEmailVerified, requireRole("client", "admin"), confirmFunding);

router.get("/:id", requireAuth, getOne);

router.post("/:id/fund", requireAuth, requireEmailVerified, requireRole("client", "admin"), fund);

router.post("/:id/start", requireAuth, requireEmailVerified, requireRole("student"), start);

router.post(
  "/:id/submit",
  requireAuth,
  requireEmailVerified,
  requireRole("student"),
  validateBody(submitWorkSchema),
  submit
);

router.post("/:id/approve", requireAuth, requireEmailVerified, requireRole("client", "admin"), approve);

router.post("/:id/release", requireAuth, requireEmailVerified, requireRole("client", "admin"), retryRelease);

export default router;