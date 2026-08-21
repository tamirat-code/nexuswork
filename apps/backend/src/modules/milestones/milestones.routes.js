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
import { validateBody } from "../../shared/validators/ZodValidator.js";
import {
  createMilestoneSchema,
  submitWorkSchema,
} from "../../shared/validators/schemas.js";

const router = Router();

router.post(
  "/contract/:contractId",
  requireAuth,
  validateBody(createMilestoneSchema),
  create
);

router.get("/contract/:contractId", requireAuth, listByContract);

/*
 * Must be declared before generic /:id routes.
 * Used by FundMilestoneDialog after Stripe payment succeeds.
 */
router.post("/fund/confirm", requireAuth, confirmFunding);

router.get("/:id", requireAuth, getOne);

router.post("/:id/fund", requireAuth, fund);

router.post("/:id/start", requireAuth, start);

router.post(
  "/:id/submit",
  requireAuth,
  validateBody(submitWorkSchema),
  submit
);

router.post("/:id/approve", requireAuth, approve);

router.post("/:id/release", requireAuth, retryRelease);

export default router;