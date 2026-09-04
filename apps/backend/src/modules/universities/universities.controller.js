import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { listUniversities, getMyUniversity, createUniversity, updateUniversity, deleteUniversity } from "./universities.service.js";

export const getUniversities = asyncHandler(async (req, res) => {
  const universities = await listUniversities();
  res.json({ success: true, data: universities });
});

export const getMine = asyncHandler(async (req, res) => {
  const university = await getMyUniversity(req.user._id);
  res.json({ success: true, data: university });
});

export const addUniversity = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "domain"]);
  const university = await createUniversity(req.body);
  res.status(201).json({ success: true, data: university });
});

export const editUniversity = asyncHandler(async (req, res) => {
  const university = await updateUniversity(req.params.id, req.body);
  res.json({ success: true, data: university });
});

export const removeUniversity = asyncHandler(async (req, res) => {
  const result = await deleteUniversity(req.params.id);
  res.json({ success: true, data: result });
});
