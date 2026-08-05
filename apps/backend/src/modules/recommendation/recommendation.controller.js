import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { getRecommendationsForStudent } from "./recommendation.service.js";

export const getMyRecommendations = asyncHandler(async (req, res) => {
  const projects = await getRecommendationsForStudent(req.user._id);
  res.json({ success: true, data: projects });
});
