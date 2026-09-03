import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { blockUser, reportUser, unblockUser } from "./safety.service.js";

export const block = asyncHandler(async (req, res) => res.json({ success: true, data: await blockUser(req.user._id, req.params.userId) }));
export const unblock = asyncHandler(async (req, res) => res.json({ success: true, data: await unblockUser(req.user._id, req.params.userId) }));
export const report = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await reportUser(req.user._id, req.params.userId, req.body.reason) }));
