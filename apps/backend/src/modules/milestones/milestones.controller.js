import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import * as milestonesService from "./milestones.service.js";

export const create = asyncHandler(async (req, res) => {
  requireFields(req.body, ["title", "amount", "due_date"]);
  const milestone = await milestonesService.createMilestone(req.params.contractId, req.user._id, req.body);
  res.status(201).json({ success: true, data: milestone });
});

export const fund = asyncHandler(async (req, res) => {
  const milestone = await milestonesService.fundMilestone(req.params.id, req.user._id);
  res.json({ success: true, data: milestone });
});

export const submit = asyncHandler(async (req, res) => {
  const result = await milestonesService.submitWork(req.params.id, req.user._id, req.body);
  res.json({ success: true, data: result });
});

export const approve = asyncHandler(async (req, res) => {
  const result = await milestonesService.approveMilestone(req.params.id, req.user._id);
  res.json({ success: true, data: result });
});
