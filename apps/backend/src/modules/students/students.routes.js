import { Router } from "express";
import { getMyProfile, updateMyProfile } from "./students.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

const router = Router();

router.get("/me", requireAuth, requireRole("student"), getMyProfile);
router.patch("/me", requireAuth, requireRole("student"), updateMyProfile);

export default router;
