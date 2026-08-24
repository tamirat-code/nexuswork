import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { listForMilestone, requestRevision, approveSubmission } from "./submissions.service.js";
import { assertSubmissionAccess, assertMilestoneAccess } from "../../shared/authorization/resource-authorization.js";

export const getForMilestone = asyncHandler(async (req, res) => {
  await assertMilestoneAccess({ milestoneId: req.params.milestoneId, req, role: req.user.role === "client" ? "client" : "student" });
  const submissions = await listForMilestone(req.params.milestoneId, req.user._id);
  res.json({ success: true, data: submissions });
});

export const flagRevision = asyncHandler(async (req, res) => {
  await assertSubmissionAccess({ submissionId: req.params.id, req, role: "client" });
  const submission = await requestRevision(
    req.params.id,
    req.user._id,
    req.body?.reason || "",
    { actor: req.user, correlationId: req.correlationId }
  );
  res.json({ success: true, data: submission });
});

export const approve = asyncHandler(async (req, res) => {
  await assertMilestoneAccess({ milestoneId: req.params.milestoneId, req, role: "client" });
  const submission = await approveSubmission(req.params.milestoneId, req.user._id, {
    actor: req.user,
    correlationId: req.correlationId,
  });
  res.json({ success: true, data: submission });
});
