import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { openDispute, resolveDispute, listOpen, getDisputeEvidence } from "./disputes.service.js";

export const create = asyncHandler(async (req, res) => {
  const dispute = await openDispute(req.params.milestoneId, req.user._id);
  res.status(201).json({ success: true, data: dispute });
});

export const getEvidence = asyncHandler(async (req, res) => {
  const evidence = await getDisputeEvidence(req.params.id, req.user);
  res.json({ success: true, data: evidence });
});

export const resolve = asyncHandler(async (req, res) => {
  requireFields(req.body, ["outcome"]);
  const dispute = await resolveDispute(req.params.id, req.body);
  res.json({ success: true, data: dispute });
});

export const getOpen = asyncHandler(async (req, res) => {
  const disputes = await listOpen();
  res.json({ success: true, data: disputes });
});