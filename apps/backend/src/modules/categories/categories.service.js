import Category from "./categories.model.js";
import { NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

export async function listCategories({ activeOnly = true } = {}) {
  const query = activeOnly ? { is_active: true } : {};
  return Category.find(query).sort({ sort_order: 1, name: 1 }).lean();
}

export async function getCategoryById(id) {
  const category = await Category.findById(id).lean();
  if (!category) throw new NotFoundError("Category not found");
  return category;
}

export async function getCategoryBySlug(slug) {
  const category = await Category.findOne({ slug }).lean();
  if (!category) throw new NotFoundError("Category not found");
  return category;
}

export async function createCategory({ name, slug, description, icon, sort_order = 0 }) {
  const existing = await Category.findOne({ $or: [{ name }, { slug }] });
  if (existing) throw new ValidationError("A category with that name or slug already exists");

  return Category.create({ name, slug, description, icon, sort_order });
}

export async function updateCategory(id, updates) {
  const category = await Category.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!category) throw new NotFoundError("Category not found");
  return category;
}

export async function deleteCategory(id) {
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new NotFoundError("Category not found");
  return { deleted: true };
}