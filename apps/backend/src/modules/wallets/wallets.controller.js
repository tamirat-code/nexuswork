import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { getBalance, startOnboarding } from "./wallets.service.js";

export const getMyWallet = asyncHandler(async (req, res) => {
  const balance = await getBalance(req.user._id);
  res.json({ success: true, data: balance });
});

export const connectOnboarding = asyncHandler(async (req, res) => {
  const result = await startOnboarding(req.user._id);
  res.json({ success: true, data: result });
});