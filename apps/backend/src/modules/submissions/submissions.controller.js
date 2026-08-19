import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { listForMilestone, requestRevision, approveSubmission } from "./submissions.service.js";

export const getForMilestone = asyncHandler(async (req, res) => {
  const submissions = await listForMilestone(req.params.milestoneId, req.user._id);
  res.json({ success: true, data: submissions });
});

export const flagRevision = asyncHandler(async (req, res) => {
  const submission = await requestRevision(
    req.params.id,
    req.user._id,
    req.body?.reason || ""
  );
  res.json({ success: true, data: submission });
});

export const approve = asyncHandler(async (req, res) => {
  const submission = await approveSubmission(req.params.milestoneId, req.user._id);
  res.json({ success: true, data: submission });
});