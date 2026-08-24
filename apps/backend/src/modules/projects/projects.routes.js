import { Router } from "express";
import { postProject, listProjects, getProject } from "./projects.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { requireEmailVerified } from "../../middleware/verification.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { createProjectSchema } from "../../shared/validators/schemas.js";
import { ROLES } from "../../shared/enums/roles.enum.js";

const router = Router();

router.get("/", listProjects);
router.get("/:id", getProject);
router.post("/", requireAuth, requireEmailVerified, requireRole(ROLES.CLIENT), validateBody(createProjectSchema), postProject);

export default router;