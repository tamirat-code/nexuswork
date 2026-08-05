import { Router } from "express";
import { getMyRecommendations } from "./recommendation.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

const router = Router();

router.get("/me", requireAuth, requireRole("student"), getMyRecommendations);

export default router;
