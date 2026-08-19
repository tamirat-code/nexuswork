import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import * as milestonesService from "./milestones.service.js";

export const create = asyncHandler(async (req, res) => {
  requireFields(req.body, ["title", "amount", "due_date"]);
  const milestone = await milestonesService.createMilestone(req.params.contractId, req.user._id, req.body);
  res.status(201).json({ success: true, data: milestone });
});

export const listByContract = asyncHandler(async (req, res) => {
  const milestones = await milestonesService.listForContract(req.params.contractId, {
    limit: req.query.limit,
    skip: req.query.skip,
  });
  res.json({ success: true, data: milestones });
});

export const getOne = asyncHandler(async (req, res) => {
  const milestone = await milestonesService.getById(req.params.id);
  res.json({ success: true, data: milestone });
});

export const fund = asyncHandler(async (req, res) => {
  const result = await milestonesService.initiateFunding(req.params.id, req.user._id);
  res.json({ success: true, data: result });
});

export const confirmFundingResult = asyncHandler(async (req, res) => {
  requireFields(req.body, ["payment_intent_id"]);
  const milestone = await milestonesService.confirmFundingForMilestone(
    req.params.id,
    req.user._id,
    req.body.payment_intent_id
  );
  res.json({ success: true, data: milestone });
});

export const startWork = asyncHandler(async (req, res) => {
  const milestone = await milestonesService.startWork(req.params.id, req.user._id);
  res.json({ success: true, data: milestone });
});

export const submit = asyncHandler(async (req, res) => {
  const result = await milestonesService.submitWork(req.params.id, req.user._id, req.body);
  res.json({ success: true, data: result });
});

export const requestRevision = asyncHandler(async (req, res) => {
  const submission = await milestonesService.requestRevision(
    req.params.id,
    req.user._id,
    req.body?.reason || ""
  );
  res.json({ success: true, data: submission });
});

export const approve = asyncHandler(async (req, res) => {
  const result = await milestonesService.approveMilestone(req.params.id, req.user._id);
  res.json({ success: true, data: result });
});