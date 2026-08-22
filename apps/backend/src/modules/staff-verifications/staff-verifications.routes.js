import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { ROLES } from "../../shared/enums/roles.enum.js";
import { requestStaffVerification, getMine, getAll, stats, review } from "./staff-verifications.controller.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { submitStaffVerificationSchema, reviewStaffVerificationSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post("/", requireAuth, validateBody(submitStaffVerificationSchema), requestStaffVerification);
router.get("/mine", requireAuth, getMine);
router.get("/stats", requireAuth, requireRole(ROLES.ADMIN), stats);
router.get("/", requireAuth, requireRole(ROLES.ADMIN), getAll);
router.patch("/:id/review", requireAuth, requireRole(ROLES.ADMIN), validateBody(reviewStaffVerificationSchema), review);

export default router;