import { Router } from "express";
import { getMyRecommendations, getMyCareerRecommendation, getStudentMatchesForProject, getSuggestedPrice } from "./recommendation.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

const router = Router();

router.get("/me", requireAuth, requireRole("student"), getMyRecommendations);
router.get("/career", requireAuth, requireRole("student"), getMyCareerRecommendation);
// Authorization (project owner, org member, or admin) enforced in the service layer.
router.get("/project/:projectId/students", requireAuth, requireRole("client", "admin"), getStudentMatchesForProject);
router.get("/price-suggestion", requireAuth, requireRole("client", "admin"), getSuggestedPrice);

export default router;