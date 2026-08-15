import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { sendMessage, listMessages } from "./messaging.service.js";

export const create = asyncHandler(async (req, res) => {
  requireFields(req.body, ["body"]);
  const message = await sendMessage(req.params.contractId, req.user._id, req.body);
  res.status(201).json({ success: true, data: message });
});

export const getForContract = asyncHandler(async (req, res) => {
  const { limit = 50, skip = 0 } = req.pagination || {};
  const messages = await listMessages(req.params.contractId, req.user._id, { limit, skip });
  res.json({ success: true, data: messages });
});
