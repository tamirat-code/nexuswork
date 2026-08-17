import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import {
  getOrCreateProfile,
  updateProfile,
  listClientDirectory,
  submitClientVerification,
  listClientVerifications,
  reviewClientVerification,
  addPoster,
  removePoster,
} from "./clients.service.js";
export const listClients = asyncHandler(async (req, res) => {
  const clients = await listClientDirectory({
    search: req.query.search,
    limit: req.query.limit,
    skip: req.query.skip,
  });
  res.json({ success: true, data: clients });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user._id);
  res.json({ success: true, data: profile });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await updateProfile(req.user._id, req.body);
  res.json({ success: true, data: profile });
});

export const requestVerification = asyncHandler(async (req, res) => {
  const profile = await submitClientVerification(req.user._id, { documentFileId: req.body.document_file_id });
  res.status(201).json({ success: true, data: profile });
});

export const getVerifications = asyncHandler(async (req, res) => {
  const verifications = await listClientVerifications({
    status: req.query.status,
    limit: req.query.limit,
    skip: req.query.skip,
  });
  res.json({ success: true, data: verifications });
});

export const reviewVerification = asyncHandler(async (req, res) => {
  requireFields(req.body, ["decision"]);
  const profile = await reviewClientVerification({
    clientUserId: req.params.userId,
    reviewerId: req.user._id,
    decision: req.body.decision,
    rejectionReason: req.body.rejection_reason,
  });
  res.json({ success: true, data: profile });
});

export const postAdditionalPoster = asyncHandler(async (req, res) => {
  requireFields(req.body, ["user_id"]);
  const profile = await addPoster(req.user._id, req.body.user_id);
  res.status(201).json({ success: true, data: profile });
});

export const deleteAdditionalPoster = asyncHandler(async (req, res) => {
  const profile = await removePoster(req.user._id, req.params.userId);
  res.json({ success: true, data: profile });
});