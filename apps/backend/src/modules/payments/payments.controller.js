import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { listForUser } from "./payments.service.js";

export const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await listForUser(req.user._id);
  res.json({ success: true, data: payments });
});
