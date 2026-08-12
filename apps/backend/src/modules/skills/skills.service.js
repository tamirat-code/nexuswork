import Skill from "./skills.model.js";
import { NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

export async function listSkills({ activeOnly = true, search = "", category = "" } = {}) {
  const query = {};
  if (activeOnly) query.is_active = true;
  if (search) query.$text = { $search: search };
  if (category) query.category = category;

  return Skill.find(query).sort({ name: 1 }).limit(200).lean();
}

export async function getSkillById(id) {
  const skill = await Skill.findById(id).lean();
  if (!skill) throw new NotFoundError("Skill not found");
  return skill;
}

export async function createSkill({ name, slug, category, description }) {
  const existing = await Skill.findOne({ $or: [{ name }, { slug }] });
  if (existing) throw new ValidationError("A skill with that name or slug already exists");

  return Skill.create({ name, slug, category, description });
}

export async function updateSkill(id, updates) {
  const skill = await Skill.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!skill) throw new NotFoundError("Skill not found");
  return skill;
}

export async function deleteSkill(id) {
  const skill = await Skill.findByIdAndDelete(id);
  if (!skill) throw new NotFoundError("Skill not found");
  return { deleted: true };
}