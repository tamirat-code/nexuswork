import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { listUniversities, createUniversity } from "./universities.service.js";

export const getUniversities = asyncHandler(async (req, res) => {
  const universities = await listUniversities();
  res.json({ success: true, data: universities });
});

export const addUniversity = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "domain"]);
  const university = await createUniversity(req.body);
  res.status(201).json({ success: true, data: university });
});
