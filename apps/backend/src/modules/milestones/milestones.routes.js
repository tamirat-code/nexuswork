import { Router } from "express";
import { create, fund, submit, approve } from "./milestones.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/contract/:contractId", requireAuth, create);
router.post("/:id/fund", requireAuth, fund);
router.post("/:id/submit", requireAuth, submit);
router.post("/:id/approve", requireAuth, approve);

export default router;
