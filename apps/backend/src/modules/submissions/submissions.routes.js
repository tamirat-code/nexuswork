import { Router } from "express";
import { getForMilestone, flagRevision } from "./submissions.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/milestone/:milestoneId", requireAuth, getForMilestone);
router.post("/:id/request-revision", requireAuth, flagRevision);

export default router;
