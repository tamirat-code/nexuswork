import { Router } from "express";
import { getMyProfile, updateMyProfile } from "./clients.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { updateClientProfileSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.get("/me", requireAuth, requireRole("client"), getMyProfile);
router.patch("/me", requireAuth, requireRole("client"), validateBody(updateClientProfileSchema), updateMyProfile);

export default router;
