import { Router } from "express";
import { postProject, listProjects, getProject } from "./projects.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", listProjects);
router.get("/:id", getProject);
router.post("/", requireAuth, postProject);

export default router;
