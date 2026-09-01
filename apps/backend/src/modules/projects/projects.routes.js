import { Router } from "express";
import { postProject, listProjects, getProject, patchProject, closeProject } from "./projects.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { requireEmailVerified } from "../../middleware/verification.middleware.js";
import { validateBody, validateParams } from "../../shared/validators/ZodValidator.js";
import { objectIdParamsSchema } from "../../shared/validators/schemas.js";
import { createProjectSchema, updateProjectSchema } from "../../shared/validators/schemas.js";
import { ROLES } from "../../shared/enums/roles.enum.js";

const router = Router();

router.get("/", listProjects);
router.get("/:id", getProject);
router.post("/", requireAuth, requireEmailVerified, requireRole(ROLES.CLIENT), validateBody(createProjectSchema), postProject);
router.patch("/:id", requireAuth, requireEmailVerified, requireRole(ROLES.CLIENT), validateParams(objectIdParamsSchema("id")), validateBody(updateProjectSchema), patchProject);
router.post("/:id/close", requireAuth, requireEmailVerified, requireRole(ROLES.CLIENT), validateParams(objectIdParamsSchema("id")), closeProject);

export default router;
