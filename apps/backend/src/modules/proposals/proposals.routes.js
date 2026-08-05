import { Router } from "express";
import { createProposal, getProjectProposals, accept } from "./proposals.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, createProposal);
router.get("/project/:projectId", requireAuth, getProjectProposals);
router.post("/:id/accept", requireAuth, accept);

export default router;
