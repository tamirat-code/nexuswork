import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { getOrCreateProfile, updateProfile } from "./clients.service.js";

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user._id);
  res.json({ success: true, data: profile });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await updateProfile(req.user._id, req.body);
  res.json({ success: true, data: profile });
});
