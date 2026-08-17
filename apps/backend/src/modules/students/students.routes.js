import { Router } from "express";
import { getMyProfile, updateMyProfile, listStudents } from "./students.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { updateStudentProfileSchema } from "../../shared/validators/schemas.js";

const router = Router();


router.get("/", listStudents);

router.get("/me", requireAuth, requireRole("student"), getMyProfile);
router.patch("/me", requireAuth, requireRole("student"), validateBody(updateStudentProfileSchema), updateMyProfile);

export default router;