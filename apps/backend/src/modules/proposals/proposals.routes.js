import { Router } from "express";
import { createProposal, getProjectProposals, accept } from "./proposals.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { submitProposalSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post("/", requireAuth, validateBody(submitProposalSchema), createProposal);
router.get("/project/:projectId", requireAuth, getProjectProposals);
router.post("/:id/accept", requireAuth, accept);

export default router;
