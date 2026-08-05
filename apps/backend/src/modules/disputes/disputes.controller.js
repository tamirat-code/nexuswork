import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { openDispute, resolveDispute, listOpen } from "./disputes.service.js";

export const create = asyncHandler(async (req, res) => {
  const dispute = await openDispute(req.params.milestoneId, req.user._id);
  res.status(201).json({ success: true, data: dispute });
});

export const resolve = asyncHandler(async (req, res) => {
  const dispute = await resolveDispute(req.params.id, req.body.resolution_summary);
  res.json({ success: true, data: dispute });
});

export const getOpen = asyncHandler(async (req, res) => {
  const disputes = await listOpen();
  res.json({ success: true, data: disputes });
});
