import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { getResources, getResource, postResource, patchResource, removeResource } from "./learning.controller.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { createLearningResourceSchema, updateLearningResourceSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.get("/", getResources);
router.get("/:id", getResource);
router.post("/", requireAuth, requireRole("admin"), validateBody(createLearningResourceSchema), postResource);
router.patch("/:id", requireAuth, requireRole("admin"), validateBody(updateLearningResourceSchema), patchResource);
router.delete("/:id", requireAuth, requireRole("admin"), removeResource);

export default router;