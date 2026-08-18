import { Router } from "express";

import {
  createProposal,
  getProjectProposals,
  getIncomingProposals,
  accept,
  reject,
} from "./proposals.controller.js";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { submitProposalSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  validateBody(submitProposalSchema),
  createProposal
);


router.get(
  "/incoming",
  requireAuth,
  getIncomingProposals
);


router.get(
  "/project/:projectId",
  requireAuth,
  getProjectProposals
);


router.post(
  "/:id/accept",
  requireAuth,
  accept
);


router.post(
  "/:id/reject",
  requireAuth,
  reject
);

export default router;