import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { openDispute, resolveDispute, listOpen, listForUser, getDisputeEvidence } from "./disputes.service.js";
import { assertDisputeAccess, assertMilestoneAccess } from "../../shared/authorization/resource-authorization.js";

export const create = asyncHandler(async (req, res) => {
  requireFields(req.body, ["reason"]);
  await assertMilestoneAccess({ milestoneId: req.params.milestoneId, req });
  const dispute = await openDispute(req.params.milestoneId, req.user._id, req.body.reason, {
    actor: req.user,
    correlationId: req.correlationId,
  });
  res.status(201).json({ success: true, data: dispute });
});

export const getEvidence = asyncHandler(async (req, res) => {
  await assertDisputeAccess({ disputeId: req.params.id, req, allowAdmin: true });
  const evidence = await getDisputeEvidence(req.params.id, req.user);
  res.json({ success: true, data: evidence });
});

export const resolve = asyncHandler(async (req, res) => {
  requireFields(req.body, ["outcome"]);
  await assertDisputeAccess({ disputeId: req.params.id, req, allowAdmin: true });
  const dispute = await resolveDispute(req.params.id, req.body, {
    actor: req.user,
    correlationId: req.correlationId,
  });
  res.json({ success: true, data: dispute });
});

export const getOpen = asyncHandler(async (req, res) => {
  const disputes = await listOpen();
  res.json({ success: true, data: disputes });
});

export const getMine = asyncHandler(async (req, res) => {
  const disputes = await listForUser(req.user._id);
  res.json({ success: true, data: disputes });
});
