import { Router } from "express";
import { postProject, listProjects, getProject } from "./projects.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { createProjectSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.get("/", listProjects);
router.get("/:id", getProject);
router.post("/", requireAuth, validateBody(createProjectSchema), postProject);

export default router;
