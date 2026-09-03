import SavedProject from "./saved-projects.model.js";
import Project from "../projects/projects.model.js";
import { NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

export async function listSavedProjects(userId) {
  return SavedProject.find({ user_id: userId })
    .sort({ createdAt: -1 })
    .populate({ path: "project_id", populate: { path: "client_id", select: "name avatarUrl" } })
    .lean();
}

export async function saveProject(userId, projectId) {
  const project = await Project.findById(projectId).select("_id").lean();
  if (!project) throw new NotFoundError("Project not found");

  try {
    return await SavedProject.findOneAndUpdate(
      { user_id: userId, project_id: projectId },
      { $setOnInsert: { user_id: userId, project_id: projectId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code === 11000) return SavedProject.findOne({ user_id: userId, project_id: projectId });
    throw error;
  }
}

export async function unsaveProject(userId, projectId) {
  const result = await SavedProject.deleteOne({ user_id: userId, project_id: projectId });
  if (!result.deletedCount) throw new ValidationError("Project is not saved");
  return { saved: false };
}
