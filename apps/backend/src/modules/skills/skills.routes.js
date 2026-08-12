import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { getSkills, getSkill, postSkill, patchSkill, removeSkill } from "./skills.controller.js";

const router = Router();

router.get("/", getSkills);
router.get("/:id", getSkill);
router.post("/", requireAuth, requireRole("admin"), postSkill);
router.patch("/:id", requireAuth, requireRole("admin"), patchSkill);
router.delete("/:id", requireAuth, requireRole("admin"), removeSkill);

export default router;