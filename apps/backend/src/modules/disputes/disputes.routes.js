import { Router } from "express";
import { create, resolve, getOpen, getMine, getEvidence } from "./disputes.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { openDisputeSchema, resolveDisputeSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post("/milestone/:milestoneId", requireAuth, validateBody(openDisputeSchema), create);
router.get("/", requireAuth, requireRole("admin"), getOpen);
router.get("/mine", requireAuth, getMine);

router.get("/:id/evidence", requireAuth, getEvidence);
router.post("/:id/resolve", requireAuth, requireRole("admin"), validateBody(resolveDisputeSchema), resolve);

export default router;