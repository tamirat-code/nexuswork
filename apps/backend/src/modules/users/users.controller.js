import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import {
  getPublicProfile,
  getPrivateProfile,
  updateMe as updateMeService,
  updateAvatar as updateAvatarService,
  removeAvatar as removeAvatarService,
} from "./users.service.js";

export const getUser = asyncHandler(async (req, res) => {
  const profile = await getPublicProfile(req.params.id);
  if (!profile) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: profile });
});

export const getMe = asyncHandler(async (req, res) => {
  const profile = await getPrivateProfile(req.user._id);
  if (!profile) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: profile });
});

export const updateMe = asyncHandler(async (req, res) => {
  const updated = await updateMeService(req.user._id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: updated });
});

export const updateMyAvatar = asyncHandler(async (req, res) => {
  const { avatar } = req.body || {};
  if (!avatar) return res.status(400).json({ success: false, message: "Missing avatar data" });
  const updated = await updateAvatarService(req.user._id, avatar);
  if (!updated) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: updated });
});

export const removeMyAvatar = asyncHandler(async (req, res) => {
  const result = await removeAvatarService(req.user._id);
  if (!result) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true });
});
