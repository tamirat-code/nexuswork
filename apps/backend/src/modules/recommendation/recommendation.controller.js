import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { getRecommendationsForStudent, getRecommendationsForClient, getPriceSuggestion } from "./recommendation.service.js";

export const getMyRecommendations = asyncHandler(async (req, res) => {
  const projects = await getRecommendationsForStudent(req.user._id);
  res.json({ success: true, data: projects });
});

export const getStudentMatchesForProject = asyncHandler(async (req, res) => {
  const matches = await getRecommendationsForClient(req.params.projectId, req.user);
  res.json({ success: true, data: matches });
});

export const getSuggestedPrice = asyncHandler(async (req, res) => {
  const requiredSkills = Array.isArray(req.query.skills)
    ? req.query.skills
    : (req.query.skills || "").split(",").filter(Boolean);
  const suggestion = await getPriceSuggestion({ requiredSkills, category: req.query.category });
  res.json({ success: true, data: suggestion });
});