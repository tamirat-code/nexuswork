import { Router } from "express";
import { create, listByContract, getOne, fund, submit, approve } from "./milestones.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { createMilestoneSchema, submitWorkSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post("/contract/:contractId", requireAuth, validateBody(createMilestoneSchema), create);
router.get("/contract/:contractId", requireAuth, listByContract);
router.get("/:id", requireAuth, getOne);
router.post("/:id/fund", requireAuth, fund);
router.post("/:id/submit", requireAuth, validateBody(submitWorkSchema), submit);
router.post("/:id/approve", requireAuth, approve);

export default router;