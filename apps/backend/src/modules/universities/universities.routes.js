import { Router } from "express";
import { getUniversities, addUniversity } from "./universities.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

const router = Router();

router.get("/", getUniversities);
router.post("/", requireAuth, requireRole("admin"), addUniversity);

export default router;
