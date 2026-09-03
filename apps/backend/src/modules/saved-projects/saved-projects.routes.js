import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateParams } from "../../shared/validators/ZodValidator.js";
import { objectIdParamsSchema } from "../../shared/validators/schemas.js";
import { getSavedProjects, addSavedProject, removeSavedProject } from "./saved-projects.controller.js";

const router = Router();

router.get("/", requireAuth, getSavedProjects);
router.put("/:projectId", requireAuth, validateParams(objectIdParamsSchema("projectId")), addSavedProject);
router.delete("/:projectId", requireAuth, validateParams(objectIdParamsSchema("projectId")), removeSavedProject);

export default router;
