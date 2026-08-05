import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { getWallet } from "./wallets.service.js";

export const getMyWallet = asyncHandler(async (req, res) => {
  const wallet = await getWallet(req.user._id);
  res.json({ success: true, data: wallet || { balance: 0, currency: "USD" } });
});
