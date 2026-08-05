import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { listForMilestone, requestRevision } from "./submissions.service.js";

export const getForMilestone = asyncHandler(async (req, res) => {
  const submissions = await listForMilestone(req.params.milestoneId);
  res.json({ success: true, data: submissions });
});

export const flagRevision = asyncHandler(async (req, res) => {
  const submission = await requestRevision(req.params.id);
  res.json({ success: true, data: submission });
});
