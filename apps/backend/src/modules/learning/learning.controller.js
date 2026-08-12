import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { listResources, getResourceById, createResource, updateResource, deleteResource } from "./learning.service.js";

export const getResources = asyncHandler(async (req, res) => {
  const resources = await listResources({
    search: req.query.search,
    category: req.query.category,
    resourceType: req.query.type,
    difficulty: req.query.difficulty,
    limit: req.query.limit,
    skip: req.query.skip,
  });
  res.json({ success: true, data: resources });
});

export const getResource = asyncHandler(async (req, res) => {
  const resource = await getResourceById(req.params.id);
  res.json({ success: true, data: resource });
});

export const postResource = asyncHandler(async (req, res) => {
  requireFields(req.body, ["title"]);
  const resource = await createResource(req.user._id, req.body);
  res.status(201).json({ success: true, data: resource });
});

export const patchResource = asyncHandler(async (req, res) => {
  const resource = await updateResource(req.params.id, req.body);
  res.json({ success: true, data: resource });
});

export const removeResource = asyncHandler(async (req, res) => {
  const result = await deleteResource(req.params.id);
  res.json({ success: true, data: result });
});