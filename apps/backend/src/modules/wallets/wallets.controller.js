import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import {
  getBalance,
  getPayoutStatus,
  startOnboarding,
  listTransactions,
  requestWithdrawal,
  saveChapaPayoutDetails,
  getChapaBanks,
} from "./wallets.service.js";

export const getMyWallet = asyncHandler(async (req, res) => {
  const balance = await getBalance(req.user._id);
  res.json({ success: true, data: balance });
});

export const getMyPayoutStatus = asyncHandler(async (req, res) => {
  const status = await getPayoutStatus(req.user._id);
  res.json({ success: true, data: status });
});

export const getMyChapaBanks = asyncHandler(async (req, res) => {
  const banks = await getChapaBanks();
  res.json({ success: true, data: banks });
});

export const connectOnboarding = asyncHandler(async (req, res) => {
  const result = await startOnboarding(req.user._id);
  res.json({ success: true, data: result });
});

export const updateChapaPayout = asyncHandler(async (req, res) => {
  const wallet = await saveChapaPayoutDetails(req.user._id, req.body, {
    actor: req.user,
    correlationId: req.correlationId,
  });
  res.json({ success: true, data: wallet });
});

export const getMyTransactions = asyncHandler(async (req, res) => {
  const transactions = await listTransactions(req.user._id, { limit: req.query.limit });
  res.json({ success: true, data: transactions });
});

export const postWithdrawal = asyncHandler(async (req, res) => {
  requireFields(req.body, ["amount"]);
  const withdrawal = await requestWithdrawal(req.user._id, Number(req.body.amount), {
    actor: req.user,
    correlationId: req.correlationId,
    idempotencyKey: req.headers["idempotency-key"],
  });
  res.status(201).json({ success: true, data: withdrawal });
});
