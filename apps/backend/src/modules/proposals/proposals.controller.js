import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { ForbiddenError } from "../../shared/exceptions/AppError.js";
import { submitProposal, listForUser, listForProject, acceptProposal } from "./proposals.service.js";

export const createProposal = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") throw new ForbiddenError("Only students can submit proposals");
  requireFields(req.body, ["project_id", "price", "delivery_time_days", "cover_note"]);
  try {
    const proposal = await submitProposal(req.user._id, req.body);
    res.status(201).json({ success: true, data: proposal });
  } catch (err) {
    if (err.code === 11000) {
      err.status = 409;
      err.message = "You already submitted a proposal for this project";
    }
    throw err;
  }
});

export const getMyProposals = asyncHandler(async (req, res) => {
  const proposals = await listForUser(req.user._id, req.user.role);
  res.json({ success: true, data: proposals });
});

export const getProjectProposals = asyncHandler(async (req, res) => {
  const proposals = await listForProject(req.params.projectId, req.user);
  res.json({ success: true, data: proposals });
});

export const accept = asyncHandler(async (req, res) => {
  const result = await acceptProposal(req.params.id, req.user);
  res.json({ success: true, data: result });
});
