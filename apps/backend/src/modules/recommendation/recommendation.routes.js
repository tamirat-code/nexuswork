import { Router } from "express";
import { getMyRecommendations, getMyCareerRecommendation, getStudentMatchesForProject, getSuggestedPrice, getMyRecommendationHistory, postRecommendationFeedback } from "./recommendation.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validateParams } from "../../shared/validators/ZodValidator.js";
import { objectIdParamsSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.get("/me", requireAuth, requireRole("student"), getMyRecommendations);
router.get("/career", requireAuth, requireRole("student"), getMyCareerRecommendation);
router.get("/history", requireAuth, requireRole("student"), getMyRecommendationHistory);
router.post("/:projectId/feedback", requireAuth, requireRole("student"), validateParams(objectIdParamsSchema("projectId")), postRecommendationFeedback);
// Authorization (project owner, org member, or admin) enforced in the service layer.
router.get("/project/:projectId/students", requireAuth, requireRole("client", "admin"), validateParams(objectIdParamsSchema("projectId")), getStudentMatchesForProject);
router.get("/price-suggestion", requireAuth, requireRole("client", "admin"), getSuggestedPrice);

export default router;
