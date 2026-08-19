import { Router } from "express";
import { getForMilestone, flagRevision, approve } from "./submissions.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { requestRevisionSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.get("/milestone/:milestoneId", requireAuth, getForMilestone);
router.post("/:id/request-revision", requireAuth, validateBody(requestRevisionSchema), flagRevision);
router.post("/milestone/:milestoneId/approve", requireAuth, approve);

export default router;