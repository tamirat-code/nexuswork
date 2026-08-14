import { Router } from "express";
import { getUniversities, addUniversity } from "./universities.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { createUniversitySchema } from "../../shared/validators/schemas.js";

const router = Router();

router.get("/", getUniversities);
router.post("/", requireAuth, requireRole("admin"), validateBody(createUniversitySchema), addUniversity);

export default router;
