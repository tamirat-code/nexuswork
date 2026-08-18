import { Router } from "express";
import { getUniversities, getMine, addUniversity } from "./universities.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { ROLES } from "../../shared/enums/roles.enum.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { createUniversitySchema } from "../../shared/validators/schemas.js";

const router = Router();

router.get("/", getUniversities);
router.get("/mine", requireAuth, requireRole(ROLES.UNIVERSITY_STAFF), getMine);
router.post("/", requireAuth, requireRole("admin"), validateBody(createUniversitySchema), addUniversity);

export default router;