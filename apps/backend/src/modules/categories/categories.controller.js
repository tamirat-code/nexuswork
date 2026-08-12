import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { ForbiddenError } from "../../shared/exceptions/AppError.js";
import { ROLES } from "../../shared/enums/roles.enum.js";
import {
  listCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./categories.service.js";

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await listCategories({ activeOnly: req.query.all !== "true" });
  res.json({ success: true, data: categories });
});

export const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = id.length === 24 ? await getCategoryById(id) : await getCategoryBySlug(id);
  res.json({ success: true, data: category });
});

export const postCategory = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) throw new ForbiddenError("Only admins can create categories");
  requireFields(req.body, ["name", "slug"]);
  const category = await createCategory(req.body);
  res.status(201).json({ success: true, data: category });
});

export const patchCategory = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) throw new ForbiddenError("Only admins can update categories");
  const category = await updateCategory(req.params.id, req.body);
  res.json({ success: true, data: category });
});

export const removeCategory = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) throw new ForbiddenError("Only admins can delete categories");
  const result = await deleteCategory(req.params.id);
  res.json({ success: true, data: result });
});