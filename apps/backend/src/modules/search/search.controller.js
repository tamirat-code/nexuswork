import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { searchAll } from "./search.service.js";

export const search = asyncHandler(async (req, res) => {
  const result = await searchAll({
    q: req.query.q,
    type: req.query.type,
    limit: req.query.limit,
    skip: req.query.skip,
  });
  res.json({ success: true, data: result });
});