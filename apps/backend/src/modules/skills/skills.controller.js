import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { ForbiddenError } from "../../shared/exceptions/AppError.js";
import { ROLES } from "../../shared/enums/roles.enum.js";
import { listSkills, getSkillById, createSkill, updateSkill, deleteSkill } from "./skills.service.js";

export const getSkills = asyncHandler(async (req, res) => {
  const skills = await listSkills({
    activeOnly: req.query.all !== "true",
    search: req.query.search,
    category: req.query.category,
  });
  res.json({ success: true, data: skills });
});

export const getSkill = asyncHandler(async (req, res) => {
  const skill = await getSkillById(req.params.id);
  res.json({ success: true, data: skill });
});

export const postSkill = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) throw new ForbiddenError("Only admins can create skills");
  requireFields(req.body, ["name", "slug"]);
  const skill = await createSkill(req.body);
  res.status(201).json({ success: true, data: skill });
});

export const patchSkill = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) throw new ForbiddenError("Only admins can update skills");
  const skill = await updateSkill(req.params.id, req.body);
  res.json({ success: true, data: skill });
});

export const removeSkill = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) throw new ForbiddenError("Only admins can delete skills");
  const result = await deleteSkill(req.params.id);
  res.json({ success: true, data: result });
});