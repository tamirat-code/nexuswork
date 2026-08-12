import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { ROLES } from "../../shared/enums/roles.enum.js";
import { postEvent, getPlatform, getMine } from "./analytics.controller.js";

const router = Router();

router.post("/events", requireAuth, postEvent);
router.get("/platform", requireAuth, requireRole(ROLES.ADMIN), getPlatform);
router.get("/me", requireAuth, getMine);

export default router;