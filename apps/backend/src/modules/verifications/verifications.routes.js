import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { ROLES } from "../../shared/enums/roles.enum.js";
import { requestVerification, getMine, getAll, review, certifySkill } from "./verifications.controller.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { submitVerificationSchema, reviewVerificationSchema, certifySkillSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post("/", requireAuth, validateBody(submitVerificationSchema), requestVerification);
router.get("/mine", requireAuth, getMine);
router.get("/", requireAuth, requireRole(ROLES.ADMIN), getAll);
router.patch("/:id/review", requireAuth, validateBody(reviewVerificationSchema), review);

router.post(
  "/students/:userId/skills/certify",
  requireAuth,
  requireRole(ROLES.UNIVERSITY_STAFF, ROLES.ADMIN),
  validateBody(certifySkillSchema),
  certifySkill
);

export default router;