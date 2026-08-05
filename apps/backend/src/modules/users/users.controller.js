import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { getPublicProfile } from "./users.service.js";

export const getUser = asyncHandler(async (req, res) => {
  const profile = await getPublicProfile(req.params.id);
  if (!profile) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: profile });
});
