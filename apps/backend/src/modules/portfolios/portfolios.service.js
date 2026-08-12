import PortfolioItem from "./portfolios.model.js";
import { NotFoundError, ForbiddenError } from "../../shared/exceptions/AppError.js";

export async function createPortfolioItem(userId, data) {
  return PortfolioItem.create({
    user_id: userId,
    title: data.title,
    description: data.description || "",
    project_url: data.project_url,
    image_url: data.image_url,
    file_id: data.file_id,
    tags: data.tags || [],
    is_published: data.is_published !== undefined ? data.is_published : true,
  });
}

export async function listForUser(userId, { publishedOnly = false } = {}) {
  const query = { user_id: userId };
  if (publishedOnly) query.is_published = true;
  return PortfolioItem.find(query).sort({ createdAt: -1 }).lean();
}

export async function getById(id) {
  const item = await PortfolioItem.findById(id).lean();
  if (!item) throw new NotFoundError("Portfolio item not found");
  return item;
}

export async function updatePortfolioItem(id, userId, updates) {
  const item = await PortfolioItem.findById(id);
  if (!item) throw new NotFoundError("Portfolio item not found");
  if (String(item.user_id) !== String(userId)) throw new ForbiddenError("Only the owner can update this portfolio item");

  Object.assign(item, updates);
  await item.save();
  return item;
}

export async function deletePortfolioItem(id, userId) {
  const item = await PortfolioItem.findById(id);
  if (!item) throw new NotFoundError("Portfolio item not found");
  if (String(item.user_id) !== String(userId)) throw new ForbiddenError("Only the owner can delete this portfolio item");

  await item.deleteOne();
  return { deleted: true };
}