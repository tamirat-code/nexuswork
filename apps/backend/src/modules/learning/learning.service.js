import LearningResource from "./learning.model.js";
import { NotFoundError } from "../../shared/exceptions/AppError.js";

export async function listResources({ search, category, resourceType, difficulty, publishedOnly = true, limit = 50, skip = 0 }) {
  const query = {};
  if (publishedOnly) query.is_published = true;
  if (category) query.category = category;
  if (resourceType) query.resource_type = resourceType;
  if (difficulty && difficulty !== "all") query.difficulty = difficulty;
  if (search) query.$text = { $search: search };

  return LearningResource.find(query)
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit))
    .lean();
}

export async function getResourceById(id) {
  const resource = await LearningResource.findById(id).lean();
  if (!resource) throw new NotFoundError("Learning resource not found");
  return resource;
}

export async function createResource(userId, data) {
  return LearningResource.create({
    title: data.title,
    description: data.description || "",
    category: data.category,
    resource_type: data.resource_type || "other",
    url: data.url,
    file_id: data.file_id,
    author_id: userId,
    tags: data.tags || [],
    difficulty: data.difficulty || "all",
    is_published: data.is_published !== undefined ? data.is_published : true,
  });
}

export async function updateResource(id, updates) {
  const resource = await LearningResource.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!resource) throw new NotFoundError("Learning resource not found");
  return resource;
}

export async function deleteResource(id) {
  const resource = await LearningResource.findByIdAndDelete(id);
  if (!resource) throw new NotFoundError("Learning resource not found");
  return { deleted: true };
}