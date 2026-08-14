import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { getSkills, getSkill, postSkill, patchSkill, removeSkill } from "./skills.controller.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { createSkillSchema, updateSkillSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.get("/", getSkills);
router.get("/:id", getSkill);
router.post("/", requireAuth, requireRole("admin"), validateBody(createSkillSchema), postSkill);
router.patch("/:id", requireAuth, requireRole("admin"), validateBody(updateSkillSchema), patchSkill);
router.delete("/:id", requireAuth, requireRole("admin"), removeSkill);

export default router;