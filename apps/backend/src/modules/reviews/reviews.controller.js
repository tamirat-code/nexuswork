import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { submitReview, listForUser } from "./reviews.service.js";

export const create = asyncHandler(async (req, res) => {
  requireFields(req.body, ["reviewee_id", "rating"]);
  const review = await submitReview(req.params.contractId, req.user._id, req.body);
  res.status(201).json({ success: true, data: review });
});

export const getForUser = asyncHandler(async (req, res) => {
  const reviews = await listForUser(req.params.userId);
  res.json({ success: true, data: reviews });
});
