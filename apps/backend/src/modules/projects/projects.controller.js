import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { ForbiddenError, NotFoundError } from "../../shared/exceptions/AppError.js";
import { createProject, updateProject, searchProjects, getProjectById } from "./projects.service.js";

export const postProject = asyncHandler(async (req, res) => {
  if (req.user.role !== "client") throw new ForbiddenError("Only clients can post projects");
  requireFields(req.body, ["title", "description", "budget", "deadline"]);
  const project = await createProject(req.user._id, req.body);
  res.status(201).json({ success: true, data: project });
});

export const listProjects = asyncHandler(async (req, res) => {
  const projects = await searchProjects(req.query);
  res.json({ success: true, data: projects });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await getProjectById(req.params.id);
  if (!project) throw new NotFoundError("Project not found");
  res.json({ success: true, data: project });
});

export const patchProject = asyncHandler(async (req, res) => {
  const project = await updateProject(req.params.id, req.user._id, req.body);
  res.json({ success: true, data: project });
});
