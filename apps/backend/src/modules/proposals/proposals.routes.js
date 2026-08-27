import { Router } from "express";

import {
  createProposal,
  getProjectProposals,
  getIncomingProposals,
  getMyProposals,
  getCommissionPreviewForStudent,
  accept,
  reject,
} from "./proposals.controller.js";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { requireEmailVerified } from "../../middleware/verification.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { submitProposalSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireEmailVerified,
  requireRole("student"),
  validateBody(submitProposalSchema),
  createProposal
);

router.get(
  "/",
  requireAuth,
  requireRole("student"),
  getMyProposals
);

router.get(
  "/commission-preview",
  requireAuth,
  requireRole("student"),
  getCommissionPreviewForStudent
);


router.get(
  "/incoming",
  requireAuth,
  requireRole("client", "admin"),
  getIncomingProposals
);


router.get(
  "/project/:projectId",
  requireAuth,
  requireRole("client", "admin"),
  getProjectProposals
);


router.post(
  "/:id/accept",
  requireAuth,
  requireRole("client", "admin"),
  accept
);


router.post(
  "/:id/reject",
  requireAuth,
  requireRole("client", "admin"),
  reject
);

export default router;
