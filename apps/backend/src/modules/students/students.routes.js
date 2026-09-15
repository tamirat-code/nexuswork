import { Router } from "express";
import { getMyProfile, updateMyProfile, listStudents, getStudentProfile, getMyTalentApiConsent, updateMyTalentApiConsent } from "./students.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { updateStudentProfileSchema, updateTalentApiConsentSchema } from "../../shared/validators/schemas.js";

const router = Router();


router.get("/", listStudents);

router.get("/me", requireAuth, requireRole("student"), getMyProfile);
router.patch("/me", requireAuth, requireRole("student"), validateBody(updateStudentProfileSchema), updateMyProfile);
router.get("/me/talent-api-consent", requireAuth, requireRole("student"), getMyTalentApiConsent);
router.patch("/me/talent-api-consent", requireAuth, requireRole("student"), validateBody(updateTalentApiConsentSchema), updateMyTalentApiConsent);

// Public profile lookup — must stay below the /me routes above so "me" is
// never captured as an :id param.
router.get("/:id", getStudentProfile);

export default router;
