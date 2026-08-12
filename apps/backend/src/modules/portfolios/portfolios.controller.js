import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { createPortfolioItem, listForUser, getById, updatePortfolioItem, deletePortfolioItem } from "./portfolios.service.js";

export const postPortfolioItem = asyncHandler(async (req, res) => {
  requireFields(req.body, ["title"]);
  const item = await createPortfolioItem(req.user._id, req.body);
  res.status(201).json({ success: true, data: item });
});

export const getMyPortfolio = asyncHandler(async (req, res) => {
  const items = await listForUser(req.user._id);
  res.json({ success: true, data: items });
});

export const getUserPortfolio = asyncHandler(async (req, res) => {
  const items = await listForUser(req.params.userId, { publishedOnly: true });
  res.json({ success: true, data: items });
});

export const getPortfolioItem = asyncHandler(async (req, res) => {
  const item = await getById(req.params.id);
  res.json({ success: true, data: item });
});

export const patchPortfolioItem = asyncHandler(async (req, res) => {
  const item = await updatePortfolioItem(req.params.id, req.user._id, req.body);
  res.json({ success: true, data: item });
});

export const removePortfolioItem = asyncHandler(async (req, res) => {
  const result = await deletePortfolioItem(req.params.id, req.user._id);
  res.json({ success: true, data: result });
});