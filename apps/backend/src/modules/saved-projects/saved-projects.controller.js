import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { listSavedProjects, saveProject, unsaveProject } from "./saved-projects.service.js";

export const getSavedProjects = asyncHandler(async (req, res) => {
  const saved = await listSavedProjects(req.user._id);
  res.json({ success: true, data: saved });
});

export const addSavedProject = asyncHandler(async (req, res) => {
  const saved = await saveProject(req.user._id, req.params.projectId);
  res.status(201).json({ success: true, data: saved });
});

export const removeSavedProject = asyncHandler(async (req, res) => {
  const result = await unsaveProject(req.user._id, req.params.projectId);
  res.json({ success: true, data: result });
});
