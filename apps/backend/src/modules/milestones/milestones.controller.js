import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import * as milestonesService from "./milestones.service.js";
import {
  assertClientOnContract,
  assertMilestoneAccess,
  assertStudentOnContract,
} from "../../shared/authorization/resource-authorization.js";

export const create = asyncHandler(async (req, res) => {
  requireFields(req.body, ["title", "amount", "due_date"]);
  await assertClientOnContract({ contractId: req.params.contractId, req });

  const milestone = await milestonesService.createMilestone(
    req.params.contractId,
    req.user._id,
    req.body,
    { actor: req.user, correlationId: req.correlationId }
  );

  res.status(201).json({ success: true, data: milestone });
});

export const listByContract = asyncHandler(async (req, res) => {
  if (req.user.role === "client") {
    await assertClientOnContract({ contractId: req.params.contractId, req });
  } else {
    await assertStudentOnContract({ contractId: req.params.contractId, req });
  }
  const milestones = await milestonesService.listForContract(
    req.params.contractId,
    req.user._id,
    {
      limit: req.query.limit,
      skip: req.query.skip,
    }
  );

  res.json({ success: true, data: milestones });
});

export const getOne = asyncHandler(async (req, res) => {
  await assertMilestoneAccess({ milestoneId: req.params.id, req });
  const milestone = await milestonesService.getById(req.params.id, req.user._id);
  res.json({ success: true, data: milestone });
});

export const fund = asyncHandler(async (req, res) => {
  await assertMilestoneAccess({ milestoneId: req.params.id, req, role: "client" });
  const result = await milestonesService.initiateFunding(
    req.params.id,
    req.user._id,
    { actor: req.user, correlationId: req.correlationId }
  );

  res.json({ success: true, data: result });
});

export const confirmFunding = asyncHandler(async (req, res) => {
  requireFields(req.body, ["payment_intent_id"]);

  const milestone = await milestonesService.confirmFunding(
    req.body.payment_intent_id,
    req.user._id,
    { actor: req.user, correlationId: req.correlationId }
  );

  if (!milestone) {
    return res.status(404).json({
      success: false,
      message: "Payment intent or milestone not found",
    });
  }

  res.json({ success: true, data: milestone });
});

export const start = asyncHandler(async (req, res) => {
  await assertMilestoneAccess({ milestoneId: req.params.id, req, role: "student" });
  const result = await milestonesService.startWork(
    req.params.id,
    req.user._id,
    { actor: req.user, correlationId: req.correlationId }
  );

  res.json({ success: true, data: result });
});

export const submit = asyncHandler(async (req, res) => {
  await assertMilestoneAccess({ milestoneId: req.params.id, req, role: "student" });
  const result = await milestonesService.submitWork(
    req.params.id,
    req.user._id,
    req.body,
    { actor: req.user, correlationId: req.correlationId }
  );

  res.json({ success: true, data: result });
});

export const approve = asyncHandler(async (req, res) => {
  await assertMilestoneAccess({ milestoneId: req.params.id, req, role: "client" });
  const result = await milestonesService.approveMilestone(
    req.params.id,
    req.user._id,
    { actor: req.user, correlationId: req.correlationId }
  );

  res.json({ success: true, data: result });
});

export const retryRelease = asyncHandler(async (req, res) => {
  await assertMilestoneAccess({ milestoneId: req.params.id, req, role: "client" });
  const result = await milestonesService.releaseApprovedMilestone(
    req.params.id,
    req.user._id,
    { actor: req.user, correlationId: req.correlationId }
  );

  res.json({ success: true, data: result });
});
