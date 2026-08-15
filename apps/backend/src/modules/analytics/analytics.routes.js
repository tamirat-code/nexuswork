import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { ROLES } from "../../shared/enums/roles.enum.js";
import { postEvent, getPlatform, getMine, getUniversity } from "./analytics.controller.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { trackEventSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post("/events", requireAuth, validateBody(trackEventSchema), postEvent);
router.get("/platform", requireAuth, requireRole(ROLES.ADMIN), getPlatform);
router.get("/me", requireAuth, getMine);

router.get(
  "/university/:universityId",
  requireAuth,
  requireRole(ROLES.UNIVERSITY_STAFF, ROLES.ADMIN),
  getUniversity
);

export default router;