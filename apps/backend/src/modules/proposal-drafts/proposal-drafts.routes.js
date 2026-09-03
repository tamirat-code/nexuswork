import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validateBody, validateParams } from "../../shared/validators/ZodValidator.js";
import { objectIdParamsSchema, proposalDraftSchema } from "../../shared/validators/schemas.js";
import { getMyDraft, saveMyDraft, removeMyDraft } from "./proposal-drafts.controller.js";

const router = Router();
const student = [requireAuth, requireRole("student"), validateParams(objectIdParamsSchema("projectId"))];
router.get("/:projectId", ...student, getMyDraft);
router.put("/:projectId", ...student, validateBody(proposalDraftSchema), saveMyDraft);
router.delete("/:projectId", ...student, removeMyDraft);
export default router;
