import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { deleteDraft, getDraft, upsertDraft } from "./proposal-drafts.service.js";

export const getMyDraft = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getDraft(req.user._id, req.params.projectId) });
});

export const saveMyDraft = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await upsertDraft(req.user._id, req.params.projectId, req.body) });
});

export const removeMyDraft = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await deleteDraft(req.user._id, req.params.projectId) });
});
